package com.goodee.coreconnect.approval.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.approval.dto.request.ApprovalLineRequestDTO;
import com.goodee.coreconnect.approval.dto.request.ApprovalProcessRequestDTO;
import com.goodee.coreconnect.approval.dto.request.DocumentCreateRequestDTO;
import com.goodee.coreconnect.approval.dto.request.DocumentDraftRequestDTO;
import com.goodee.coreconnect.approval.dto.response.DocumentDetailResponseDTO;
import com.goodee.coreconnect.approval.dto.response.DocumentSimpleResponseDTO;
import com.goodee.coreconnect.approval.dto.response.TemplateDetailResponseDTO;
import com.goodee.coreconnect.approval.dto.response.TemplateSimpleResponseDTO;
import com.goodee.coreconnect.approval.entity.ApprovalLine;
import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.approval.entity.File;
import com.goodee.coreconnect.approval.entity.Template;
import com.goodee.coreconnect.approval.enums.ApprovalLineStatus;
import com.goodee.coreconnect.approval.enums.DocumentStatus;
import com.goodee.coreconnect.approval.repository.ApprovalLineRepository;
import com.goodee.coreconnect.approval.repository.DocumentRepository;
import com.goodee.coreconnect.approval.repository.TemplateRepository;
import com.goodee.coreconnect.chat.repository.NotificationRepository;
import com.goodee.coreconnect.common.S3Service;
import com.goodee.coreconnect.common.entity.Notification;
import com.goodee.coreconnect.common.notification.dto.NotificationPayload;
import com.goodee.coreconnect.common.notification.enums.NotificationType;
import com.goodee.coreconnect.common.notification.service.WebSocketDeliveryService;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 결재 서비스 구현체
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApprovalServiceImpl implements ApprovalService {

  private final DocumentRepository documentRepository;
  private final TemplateRepository templateRepository;
  private final UserRepository userRepository;
  private final ApprovalLineRepository approvalLineRepository;
  private final S3Service s3Service;

  private final WebSocketDeliveryService webSocketDeliveryService;
  private final NotificationRepository notificationRepository;

  /**
   * 새 결재 문서를 상신합니다.
   */
  @Override
  @Transactional
  public Integer createDocument(DocumentCreateRequestDTO requestDTO, List<MultipartFile> files, String email) {

    // 1. 기안자(User) 및 양식(Template) 조회
    User drafter = findUserByEmail(email);
    Template template = templateRepository.findById(requestDTO.getTemplateId())
        .orElseThrow(() -> new EntityNotFoundException("해당 템플릿을 찾을 수 없습니다. ID: " + requestDTO.getTemplateId()));

    // 2. 문서 엔티티 생성
    Document document = Document.createDocument(
        template, 
        drafter,
        requestDTO.getDocumentTitle(),
        requestDTO.getDocumentContent()
        );

    // 3. 결재선 엔티티 생성 (N+1 해결)
    List<ApprovalLineRequestDTO> approvalLines = requestDTO.getApprovalLines(); // DTO에서 순서가 보장된 ID List
    // 객체 리스트에서 UserId 리스트를 추출
    List<Integer> approvalIds = approvalLines.stream()
        .map(ApprovalLineRequestDTO::getUserId) 
        .collect(Collectors.toList());

    // 3-1. ID 목록으로 User 목록을 *한 번에* 조회 (쿼리 1번)
    Map<Integer, User> approverMap = userRepository.findAllById(approvalIds).stream()
        .collect(Collectors.toMap(User::getId, Function.identity()));

    AtomicInteger order = new AtomicInteger(1); // 결재 순서 (1부터 시작)

    // 3-2. '순서가 보장된 (ID+Type) DTO List'를 기준으로 루프
    approvalLines.forEach(lines -> {

      // 3-3. Map에서 ID로 User를 조회 (DB 쿼리 X, 메모리 조회)
      User approver = approverMap.get(lines.getUserId());

      // 3-4. (방어 코드) 혹시 Map에 사용자가 없는 경우
      if (approver == null) {
        throw new EntityNotFoundException("결재선에 포함된 사용자를 찾을 수 없습니다. ID: " + lines.getUserId());
      }

      ApprovalLine.createApprovalLine(
          document,
          approver,
          order.getAndIncrement(),
          lines.getType(),  // DTO에서 받은 타입(APPROVE, AGREE, REFER)
          ApprovalLineStatus.WAITING
          );
    });

    // 4. (추가) 첨부파일 처리 (S3 업로드)
    if (files != null && !files.isEmpty()) {
      try {
        for (MultipartFile file : files) {
          if (file == null || file.isEmpty()) continue;

          String fileUrl = s3Service.uploadApprovalFile(file); // S3 업로드

          File.createFile(
              document,
              file.getOriginalFilename(),
              fileUrl, // S3 URL
              file.getSize()
              );
        }
      } catch (IOException e) {
        throw new RuntimeException("파일 업로드 중 오류가 발생했습니다.", e);
      }
    }

    // 5. 문서 상신 (DRAFT -> IN_PROGRESS)
    document.submit();

    // 6. 문서 저장 (CascadeType.ALL로 인해 ApprovalLines도 함께 저장됨)
    Document savedDocument = documentRepository.save(document);


    // --- 알림 전송 로직 (첫번째 결재자에게) ---
    // 7. 첫번째 결재자 찾기
    ApprovalLine firstLine = savedDocument.getApprovalLines().stream()
        .min(Comparator.comparing(ApprovalLine::getApprovalLineOrder))
        .orElse(null);

    if (firstLine != null) {
      User firstApprover = firstLine.getApprover();
      String message = drafter.getName() + "님으로부터 새로운 결재 요청이 도착했습니다.";

      // 7-1. 페이로드 생성
      NotificationPayload payload = createNotificationPayload(
          firstApprover.getId(), // 받는사람 (첫 결재자)
          drafter.getId(),           // 보낸사람 (기안자)
          drafter.getName(),
          message,
          savedDocument.getId()
          );

      // 7-2. DB에 알림 저장
      saveNotificationToDB(payload, firstApprover, savedDocument);

      // 7-3. 실시간 알림 전송
      webSocketDeliveryService.sendToUser(firstApprover.getId(), payload);
    }

    return savedDocument.getId();
  }

  /**
   * 결재 문서를 임시저장합니다. (DRAFT 상태)
   */
  @Override
  @Transactional
  public Integer createDraft(DocumentDraftRequestDTO requestDTO, List<MultipartFile> files, String email) {

    // 1. 기안자(User) 및 양식(Template) 조회
    User drafter = findUserByEmail(email);
    Template template = templateRepository.findById(requestDTO.getTemplateId())
        .orElseThrow(() -> new EntityNotFoundException("해당 템플릿을 찾을 수 없습니다. ID: " + requestDTO.getTemplateId()));

    // 2. 문서 엔티티 생성 (기본 상태: DRAFT)
    Document document = Document.createDocument(
        template, 
        drafter,
        requestDTO.getDocumentTitle(),
        requestDTO.getDocumentContent()
        );

    // 3. 결재선 엔티티 생성 (결재선이 DTO에 포함된 경우에만)
    // DTO에서 (ID+Type) 객체 리스트를 가져옴
    List<ApprovalLineRequestDTO> approvalLineDTOs = requestDTO.getApprovalLines(); 

    // 결재선이 null이 아니고 비어있지 않다면 결재선 생성
    if (approvalLineDTOs != null && !approvalLineDTOs.isEmpty()) { 
      // 객체 리스트에서 UserId 리스트를 추출
      List<Integer> approvalIds = approvalLineDTOs.stream()
          .map(ApprovalLineRequestDTO::getUserId)
          .collect(Collectors.toList());

      Map<Integer, User> approverMap = userRepository.findAllById(approvalIds).stream()
          .collect(Collectors.toMap(User::getId, Function.identity()));

      AtomicInteger order = new AtomicInteger(1); 

      // '순서가 보장된 (ID+Type) DTO List'를 기준으로 루프
      approvalLineDTOs.forEach(lineDTO -> {
        User approver = approverMap.get(lineDTO.getUserId());
        if (approver == null) {
          throw new EntityNotFoundException("결재선에 포함된 사용자를 찾을 수 없습니다. ID: " + lineDTO.getUserId());
        }
        ApprovalLine.createApprovalLine(
            document,
            approver,
            order.getAndIncrement(),
            lineDTO.getType(), // DTO에서 받은 타입(APPROVE, AGREE, REFER)
            ApprovalLineStatus.WAITING
            );
      });
    }

    // 4. 첨부파일 처리 (S3 업로드)
    if (files != null && !files.isEmpty()) {
      try {
        for (MultipartFile file : files) {
          if (file == null || file.isEmpty()) continue;
          String fileUrl = s3Service.uploadApprovalFile(file); 
          File.createFile(
              document,
              file.getOriginalFilename(),
              fileUrl,
              file.getSize()
              );
        }
      } catch (IOException e) {
        throw new RuntimeException("파일 업로드 중 오류가 발생했습니다.", e);
      }
    }

    // 5. 문서 저장 (DRAFT 상태로 저장됨)
    Document savedDocument = documentRepository.save(document);

    return savedDocument.getId();
  }

  /**
   * 내 상신함(내가 작성한 문서) 목록을 조회합니다.
   */
  @Override
  public List<DocumentSimpleResponseDTO> getMyDocuments(String email) {
    User user = findUserByEmail(email);

    // 1. 리포지토리에서 조회
    List<Document> documents = documentRepository.findByUserAndDocDeletedYnOrderByCreatedAtDesc(user, false);

    // 2. DTO로 변환
    return documents.stream()
        .map(DocumentSimpleResponseDTO::toDTO)
        .collect(Collectors.toList());
  }

  /**
   * 임시저장함(내가 작성한 DRAFT 문서) 목록을 조회합니다.
   */
  @Override
  public List<DocumentSimpleResponseDTO> getMyDraftBox(String email) {
    User user = findUserByEmail(email);

    // 1. 레파지토리에서 'DRAFT' 상태의 문서만 조회 (새 쿼리 메소드 사용)
    List<Document> documents = documentRepository.findByUserAndDocumentStatusAndDocDeletedYnOrderByCreatedAtDesc(
        user, 
        DocumentStatus.DRAFT, 
        false
        );

    // 2. DTO로 변환
    return documents.stream()
        .map(DocumentSimpleResponseDTO::toDTO)
        .collect(Collectors.toList());
  }

  /**
   * 내 결재함(내가 결재할 문서) 목록을 조회합니다.
   */
  @Override
  public List<DocumentSimpleResponseDTO> getMyTasks(String email) {
    User approver = findUserByEmail(email);

    // 1. "현재 내 차례"인 결재선만 정확히 조회
    List<ApprovalLine> currentTurnLines = approvalLineRepository.findMyCurrentTasks(
        approver,
        ApprovalLineStatus.WAITING,
        DocumentStatus.IN_PROGRESS
        );

    // 2. 조회된 결재선에서 문서를 추출 ("내 차례"만 필터링됨)
    return currentTurnLines.stream()
        .map(ApprovalLine::getDocument) // 문서를 가져옴 (Fetch Join됨)
        .distinct() // 문서 중복 제거
        .map(DocumentSimpleResponseDTO::toDTO)
        .collect(Collectors.toList());
  }

  /**
   * 문서 상세 내용을 조회합니다.
   */
  @Override
  public DocumentDetailResponseDTO getDocumentDetail(Integer documentId, String email) {

    // (N+1이 해결된 findDocumentDetailById 쿼리를 사용)
    Document document = documentRepository.findDocumentDetailById(documentId)
        .orElseThrow(() -> new EntityNotFoundException("문서를 찾을 수 없습니다. ID: " + documentId));

    // Soft Delete 체크
    if (document.getDocDeletedYn() != null && document.getDocDeletedYn()) {
      throw new EntityNotFoundException("삭제된 문서입니다. ID: " + documentId);
    }

    User currentUser = findUserByEmail(email);
    Integer currentUserId = currentUser.getId();

    // 열람 권한 확인 (기안자 또는 결재선에 포함된 사용자인지)
    boolean isDrafter = document.getUser().getId().equals(currentUserId);

    // (Fetch Join이 적용되어 Lazy Loading 아님)
    boolean isApprover = document.getApprovalLines().stream() 
        .anyMatch(line -> line.getApprover().getId().equals(currentUserId));

    if (!isDrafter && !isApprover) {
      throw new IllegalStateException("문서를 열람할 권한이 없습니다.");
    }

    return DocumentDetailResponseDTO.toDTO(document);
  }

  /**
   * 문서를 승인합니다.
   */
  @Override
  @Transactional
  public void approveDocument(Integer documentId, ApprovalProcessRequestDTO requestDTO, String email) {

    // (비관적 락이 적용된 findByIdForUpdate 쿼리를 사용)
    Document document = documentRepository.findByIdForUpdate(documentId)
        .orElseThrow(() -> new EntityNotFoundException("문서를 찾을 수 없습니다. ID: " + documentId));

    // Soft Delete 체크 로직
    if (document.getDocDeletedYn() != null && document.getDocDeletedYn()) {
      throw new EntityNotFoundException("삭제된 문서입니다. ID: " + documentId);
    }

    if (document.getDocumentStatus() != DocumentStatus.IN_PROGRESS) {
      throw new IllegalStateException("진행 중인 문서만 결재할 수 있습니다.");
    }

    User currentUser = findUserByEmail(email);
    Integer currentUserId = currentUser.getId();

    // 현재 결재할 차례인 결재선(ApprovalLine) 찾기 (순차 결재 가정)
    ApprovalLine currentLine = document.getApprovalLines().stream()
        .filter(line -> line.getApprovalLineStatus() == ApprovalLineStatus.WAITING)
        .min(Comparator.comparing(ApprovalLine::getApprovalLineOrder))
        .orElseThrow(() -> new IllegalStateException("결재 대기 중인 항목을 찾을 수 없습니다."));

    // 결재 권한 확인 (내 차례가 맞는지)
    if (!currentLine.getApprover().getId().equals(currentUserId)) {
      throw new IllegalStateException("현재 사용자의 결재 차례가 아닙니다.");
    }

    // 결재선 엔티티 로직 호출 (상태: WAITING -> APPROVED)
    currentLine.approve(requestDTO.getApprovalComment());

    // 문서 엔티티 로직 호출 (모든 결재 완료 시 문서 상태 'COMPLETED'로 변경)
    document.updateStatusAfterApproval();


    // --- 알림 전송 로직 (다음 결재자 또는 기안자에게) ---

    // CASE 1: 결재가 완료된 경우 (최종 승인)
    if (document.getDocumentStatus() == DocumentStatus.COMPLETED) {
      User drafter = document.getUser(); // 기안자
      String message = "상신하신 결재가 최종 승인되었습니다.";

      NotificationPayload payload = createNotificationPayload(
          drafter.getId(),     // 받는사람 (기안자)
          currentUserId,       // 보낸사람 (마지막 결재자)
          currentUser.getName(),
          message,
          document.getId()
          );

      saveNotificationToDB(payload, drafter, document);
      webSocketDeliveryService.sendToUser(drafter.getId(), payload);

    } 
    // CASE 2: 아직 진행 중인 경우 (다음 결재자에게 알림)
    else if (document.getDocumentStatus() == DocumentStatus.IN_PROGRESS) {
      // 다음 결재자 찾기
      ApprovalLine nextLine = document.getApprovalLines().stream()
          .filter(line -> line.getApprovalLineStatus() == ApprovalLineStatus.WAITING)
          .min(Comparator.comparing(ApprovalLine::getApprovalLineOrder))
          .orElse(null); // 다음 결재자가 없으면 null

      if (nextLine != null) {
        User nextApprover = nextLine.getApprover();
        User drafter = document.getUser(); // 기안자
        String message = drafter.getName() + "님으로부터 새로운 결재 요청이 도착했습니다.";

        NotificationPayload payload = createNotificationPayload(
            nextApprover.getId(), // 받는사람 (다음 결재자)
            drafter.getId(),      // 보낸사람 (기안자)
            drafter.getName(),
            message,
            document.getId()
            );

        saveNotificationToDB(payload, nextApprover, document);
        webSocketDeliveryService.sendToUser(nextApprover.getId(), payload);
      }
    }
  }

  /**
   * 문서를 반려합니다.
   */
  @Override
  @Transactional
  public void rejectDocument(Integer documentId, ApprovalProcessRequestDTO requestDTO, String email) {

    // (비관적 락이 적용된 findByIdForUpdate 쿼리를 사용)
    Document document = documentRepository.findByIdForUpdate(documentId)
        .orElseThrow(() -> new EntityNotFoundException("문서를 찾을 수 없습니다. ID: " + documentId));

    if (document.getDocDeletedYn() != null && document.getDocDeletedYn()) {
      throw new EntityNotFoundException("삭제된 문서입니다. ID: " + documentId);
    }

    if (document.getDocumentStatus() != DocumentStatus.IN_PROGRESS) {
      throw new IllegalStateException("진행 중인 문서만 결재할 수 있습니다.");
    }

    User currentUser = findUserByEmail(email);
    Integer currentUserId = currentUser.getId();

    ApprovalLine currentLine = document.getApprovalLines().stream()
        .filter(line -> line.getApprovalLineStatus() == ApprovalLineStatus.WAITING)
        .min(Comparator.comparing(ApprovalLine::getApprovalLineOrder))
        .orElseThrow(() -> new IllegalStateException("결재 대기 중인 항목을 찾을 수 없습니다."));

    if (!currentLine.getApprover().getId().equals(currentUserId)) {
      throw new IllegalStateException("현재 사용자의 결재 차례가 아닙니다.");
    }

    // 결재선 엔티티 로직 호출 (WAITING -> REJECTED)
    currentLine.reject(requestDTO.getApprovalComment());

    // 문서 엔티티 로직 호출 (IN_PROGRESS -> REJECTED)
    document.reject();

    // --- 알림 전송 로직 (기안자에게) ---
    User drafter = document.getUser(); // 기안자
    String message = "상신하신 결재가 반려되었습니다.";

    NotificationPayload payload = createNotificationPayload(
        drafter.getId(),     // 받는사람 (기안자)
        currentUserId,       // 보낸사람 (반려한 결재자)
        currentUser.getName(),
        message,
        document.getId()
        );

    saveNotificationToDB(payload, drafter, document);
    webSocketDeliveryService.sendToUser(drafter.getId(), payload);
  }

  /**
   * 활성화된 모든 양식(템플릿) 목록을 조회합니다.
   */
  @Override
  public List<TemplateSimpleResponseDTO> getActiveTemplates() {
    // (제공해주신 Repository/DTO의 'toDTO' 메소드 사용)
    List<Template> templates = templateRepository.findByActiveYnTrueOrderByTemplateNameAsc();
    return templates.stream()
        .map(TemplateSimpleResponseDTO::toDTO)
        .collect(Collectors.toList());
  }

  /**
   * 특정 양식(템플릿)의 상세 내용을 조회합니다.
   */
  @Override
  public TemplateDetailResponseDTO getTemplateDetail(Integer templateId) {
    Template template = templateRepository.findById(templateId)
        .orElseThrow(() -> new EntityNotFoundException("템플릿을 찾을 수 없습니다. ID: " + templateId));

    return TemplateDetailResponseDTO.toDTO(template);
  }

  // --- Helper Methods ---

  private User findUserByEmail(String email) {
    return userRepository.findByEmail(email)
        .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다. Email: " + email));
  }


  // --- 알림 페이로드 생성 헬퍼 메서드 ---
  private NotificationPayload createNotificationPayload(Integer recipientId, Integer senderId, String senderName, String message, Integer documentId) {

    NotificationPayload payload = new NotificationPayload();
    payload.setRecipientId(recipientId);
    payload.setSenderId(senderId);
    payload.setSenderName(senderName);
    payload.setMessage(message);
    payload.setNotificationType(NotificationType.APPROVAL.name()); 
    payload.setCreatedAt(LocalDateTime.now());
    // (필요 시) payload.setDocumentId(documentId);

    return payload;
  }

  /**
   * 알림 페이로드(DTO)를 Notification 엔티티로 변환하여 DB에 저장합니다.
   */
  private void saveNotificationToDB(NotificationPayload payload, User recipient, Document document) {
    try {
      User senderUser = userRepository.findById(payload.getSenderId()).orElse(null); // sender 정보 조회
      // (Notification 팩토리 메소드 정상 사용 확인)
      Notification notification = Notification.createNotification(
          recipient, 
          NotificationType.APPROVAL, 
          payload.getMessage(), 
          null,     // Chat
          document, // Document
          false,    // readYn
          false,    // sentYn
          false,    // deletedYn
          null,     // sentAt
          null,      // readAt
          senderUser // sender
          );

      Notification savedNotification = notificationRepository.save(notification);
      payload.setNotificationId(savedNotification.getId());

    } catch (Exception e) {
      log.error("알림 DB 저장 실패. (Recipient: {}, Document: {}). Error: {}", 
          recipient.getId(), 
          document.getId(), 
          e.getMessage()
          );
    }
  }
}