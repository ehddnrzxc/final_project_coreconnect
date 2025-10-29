package com.goodee.coreconnect.approval.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.approval.dto.request.ApprovalProcessRequestDTO;
import com.goodee.coreconnect.approval.dto.request.DocumentCreateRequestDTO;
import com.goodee.coreconnect.approval.dto.response.DocumentDetailResponseDTO;
import com.goodee.coreconnect.approval.dto.response.DocumentSimpleResponseDTO;
import com.goodee.coreconnect.approval.dto.response.TemplateDetailResponseDTO;
import com.goodee.coreconnect.approval.dto.response.TemplateSimpleResponseDTO;
import com.goodee.coreconnect.approval.entity.ApprovalLine;
import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.approval.entity.File;
import com.goodee.coreconnect.approval.entity.Template;
import com.goodee.coreconnect.approval.enums.ApprovalLineStatus;
import com.goodee.coreconnect.approval.enums.ApprovalLineType;
import com.goodee.coreconnect.approval.enums.DocumentStatus;
import com.goodee.coreconnect.approval.repository.ApprovalLineRepository;
import com.goodee.coreconnect.approval.repository.DocumentRepository;
import com.goodee.coreconnect.approval.repository.TemplateRepository;
import com.goodee.coreconnect.common.S3Service;
import com.goodee.coreconnect.common.entity.Notification;

import com.goodee.coreconnect.common.notification.dto.NotificationPayload;
import com.goodee.coreconnect.common.notification.enums.NotificationType;
import com.goodee.coreconnect.common.notification.service.WebSocketDeliveryService;
import com.goodee.coreconnect.chat.repository.NotificationRepository;
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
@Transactional(readOnly = true) // CUD 작업에는 @Transactional을 별도 명시
public class ApprovalServiceImpl implements ApprovalService {

  private final DocumentRepository documentRepository;
  private final TemplateRepository templateRepository;
  private final UserRepository userRepository;
  private final ApprovalLineRepository approvalLineRepository;
  private final S3Service s3Service;

  // --- 알림 서비스 및 리포지토리 주입 ---
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

    // 3. 결재선 엔티티 생성 (DTO의 List<Integer> 순서대로)
    AtomicInteger order = new AtomicInteger(1); // 결재 순서 (1부터 시작)
    requestDTO.getApprovalIds().forEach(approverId -> {
      User approver = findUserById(approverId);

      ApprovalLine.createApprovalLine(
          document,
          approver,
          order.getAndIncrement(),
          ApprovalLineType.APPROVE,
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

    // 4. 문서 상신 (DRAFT -> IN_PROGRESS)
    document.submit();

    // 5. 문서 저장 (CascadeType.ALL로 인해 ApprovalLines도 함께 저장됨)
    Document savedDocument = documentRepository.save(document);


    // --- 알림 전송 로직 (첫번째 결재자에게) ---
    // 6. 첫번째 결재자 찾기
    ApprovalLine firstLine = savedDocument.getApprovalLines().stream()
        .min(Comparator.comparing(ApprovalLine::getApprovalLineOrder))
        .orElse(null);

    if (firstLine != null) {
      User firstApprover = firstLine.getApprover();
      String message = drafter.getName() + "님으로부터 새로운 결재 요청이 도착했습니다.";

      // 6-1. 페이로드 생성
      NotificationPayload payload = createNotificationPayload(
          firstApprover.getId(), // 받는사람 (첫 결재자)
          drafter.getId(),         // 보낸사람 (기안자)
          drafter.getName(),
          message,
          savedDocument.getId()
          );

      // 6-2. DB에 알림 저장
      saveNotificationToDB(payload, firstApprover, savedDocument);

      // 6-3. 실시간 알림 전송
      webSocketDeliveryService.sendToUser(firstApprover.getId(), payload);
    }

    return savedDocument.getId();
  }

  /**
   * 내 상신함(내가 작성한 문서) 목록을 조회합니다.
   */
  @Override
  public List<DocumentSimpleResponseDTO> getMyDrafts(String email) {
    User user = findUserByEmail(email);

    // 1. 리포지토리에서 조회
    List<Document> documents = documentRepository.findByUserAndDocDeletedYnOrderByCreatedAtDesc(user, false);

    // 2. 서비스 로직에서 soft-delete된 항목(docDeletedYn == true) 필터링
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

    // 1. 내가 'WAITING' 상태인 모든 결재선 조회
    List<ApprovalLine> waitingLines = approvalLineRepository.findMyTasks(approver, ApprovalLineStatus.WAITING, DocumentStatus.IN_PROGRESS);

    // 2. 조회된 결재선에서 문서를 추출하고, "내 차례가 맞는지" 메모리에서 필터링
    return waitingLines.stream()
        .map(ApprovalLine::getDocument) // 문서를 가져옴
        .distinct() // 문서 중복 제거
        .filter(document -> { // <-- 💡 "내 차례" 필터링 로직 추가
          // 이 문서의 'WAITING' 상태인 결재선 중 가장 순서(order)가 빠른 선을 찾음
          ApprovalLine currentTurnLine = document.getApprovalLines().stream()
              .filter(line -> line.getApprovalLineStatus() == ApprovalLineStatus.WAITING)
              .min(Comparator.comparing(ApprovalLine::getApprovalLineOrder))
              .orElse(null); // 대기중인 선이 없으면 null

          // 그 선의 결재자가 지금 로그인한 사용(approver)이 맞는지 확인
          return currentTurnLine != null && currentTurnLine.getApprover().getId().equals(approver.getId());
        })
        .map(DocumentSimpleResponseDTO::toDTO)
        .collect(Collectors.toList());
  }

  /**
   * 문서 상세 내용을 조회합니다.
   */
  @Override
  public DocumentDetailResponseDTO getDocumentDetail(Integer documentId, String email) {

    Document document = documentRepository.findDocumentDetailById(documentId)
        .orElseThrow(() -> new EntityNotFoundException("문서를 찾을 수 없습니다. ID: " + documentId));

    // Soft Delete 체크
    if (document.getDocDeletedYn() != null && document.getDocDeletedYn()) {
      throw new EntityNotFoundException("삭제된 문서입니다. ID: " + documentId);
    }

    // email을 기반으로 userId를 가져와서 비교
    User currentUser = userRepository.findByEmail(email)
        .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다. Email: " + email));
    Integer currentUserId = currentUser.getId(); // ID 추출

    // 열람 권한 확인 (기안자 또는 결재선에 포함된 사용자인지)
    boolean isDrafter = document.getUser().getId().equals(currentUserId);

    // @Transactional(readOnly=true)이므로 Lazy Loading 가능
    boolean isApprover = document.getApprovalLines().stream() 
        .anyMatch(line -> line.getApprover().getId().equals(currentUserId));

    if (!isDrafter && !isApprover) {
      throw new IllegalStateException("문서를 열람할 권한이 없습니다.");
    }

    // DTO로 변환
    // (toDTO 메소드가 Lazy Loading을 트리거함: approvalLines, files, user 등)
    return DocumentDetailResponseDTO.toDTO(document);
  }

  /**
   * 문서를 승인합니다.
   */
  @Override
  @Transactional
  public void approveDocument(Integer documentId, ApprovalProcessRequestDTO requestDTO, String email) {

    Document document = documentRepository.findByIdForUpdate(documentId)
        .orElseThrow(() -> new EntityNotFoundException("문서를 찾을 수 없습니다. ID: " + documentId));

    // Soft Delete 체크 로직
    if (document.getDocDeletedYn() != null && document.getDocDeletedYn()) {
      throw new EntityNotFoundException("삭제된 문서입니다. ID: " + documentId);
    }

    if (document.getDocumentStatus() != DocumentStatus.IN_PROGRESS) {
      throw new IllegalStateException("진행 중인 문서만 결재할 수 있습니다.");
    }

    // email을 기반으로 userId를 가져와서 비교
    User currentUser = userRepository.findByEmail(email)
        .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다. Email: " + email));
    Integer currentUserId = currentUser.getId(); // ID 추출

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
          drafter.getId(),      // 받는사람 (기안자)
          currentUserId,        // 보낸사람 (마지막 결재자)
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
        String message = drafter.getName() + "님으로부터 새로운 결재 요청이 도착했습니다."; // (메시지는 첫 상신과 동일)

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

    Document document = documentRepository.findByIdForUpdate(documentId)
        .orElseThrow(() -> new EntityNotFoundException("문서를 찾을 수 없습니다. ID: " + documentId));

    // Soft Delete 체크 로직
    if (document.getDocDeletedYn() != null && document.getDocDeletedYn()) {
      throw new EntityNotFoundException("삭제된 문서입니다. ID: " + documentId);
    }

    if (document.getDocumentStatus() != DocumentStatus.IN_PROGRESS) {
      throw new IllegalStateException("진행 중인 문서만 결재할 수 있습니다.");
    }

    // email을 기반으로 userId를 가져와서 비교
    User currentUser = userRepository.findByEmail(email)
        .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다. Email: " + email));
    Integer currentUserId = currentUser.getId(); // ID 추출

    // 현재 결재할 차례인 결재선(ApprovalLine) 찾기
    ApprovalLine currentLine = document.getApprovalLines().stream()
        .filter(line -> line.getApprovalLineStatus() == ApprovalLineStatus.WAITING)
        .min(Comparator.comparing(ApprovalLine::getApprovalLineOrder))
        .orElseThrow(() -> new IllegalStateException("결재 대기 중인 항목을 찾을 수 없습니다."));

    // 결재 권한 확인 (내 차례가 맞는지)
    if (!currentLine.getApprover().getId().equals(currentUserId)) {
      throw new IllegalStateException("현재 사용자의 결재 차례가 아닙니다.");
    }

    // 결재선 엔티티 로직 호출 (상태: WAITING -> REJECTED)
    currentLine.reject(requestDTO.getApprovalComment());

    // 문서 엔티티 로직 호출 (상태: IN_PROGRESS -> REJECTED)
    document.reject();

    // --- 알림 전송 로직 (기안자에게) ---
    User drafter = document.getUser(); // 기안자
    String message = "상신하신 결재가 반려되었습니다.";

    NotificationPayload payload = createNotificationPayload(
        drafter.getId(),      // 받는사람 (기안자)
        currentUserId,        // 보낸사람 (반려한 결재자)
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
    // 리포지토리 쿼리(findByActiveYnTrue...) 사용
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

    // 활성화(activeYn) 여부와 관계없이 ID로 조회하여 반환
    return TemplateDetailResponseDTO.toDTO(template);
  }

  // --- Helper Methods ---

  /**
   * ID로 User를 조회하는 헬퍼 메소드
   */
  private User findUserById(Integer userId) {
    return userRepository.findById(userId)
        .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다. ID: " + userId));
  }

  private User findUserByEmail(String email) {
    return userRepository.findByEmail(email) // ✅ findByEmail 사용
        .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다. Email: " + email));
  }


  // --- 알림 페이로드 생성 헬퍼 메서드 ---
  /**
   * 알림 페이로드(DTO)를 생성합니다.
   */
  private NotificationPayload createNotificationPayload(Integer recipientId, Integer senderId, String senderName, String message, Integer documentId) {

    NotificationPayload payload = new NotificationPayload();
    payload.setRecipientId(recipientId);
    payload.setSenderId(senderId);
    payload.setSenderName(senderName);
    payload.setMessage(message);
    payload.setNotificationType(NotificationType.APPROVAL.name()); // "APPROVAL"
    payload.setCreatedAt(LocalDateTime.now());

    return payload;
  }

  /**
   * 알림 페이로드(DTO)를 Notification 엔티티로 변환하여 DB에 저장합니다.
   */
  private void saveNotificationToDB(NotificationPayload payload, User recipient, Document document) {
    try {
      // [수정해야하는 부분] new Notification() 및 setter 대신 createNotification 팩토리 메서드 사용
      Notification notification = Notification.createNotification(
          recipient,                             // User user (알림 수신자)
          NotificationType.APPROVAL,             // NotificationType notificationType
          payload.getMessage(),                  // String notificationMessage
          null,                                  // Chat chat (결재 알림이므로 null)
          document,                              // Document document (연관된 결재 문서)
          false,                                 // Boolean notificationReadYn (초기값: 안 읽음)
          false,                                 // Boolean notificationSentYn (초기값: 전송 전)
          false,                                 // Boolean notificationDeletedYn (초기값: 삭제 안 됨)
          null,                                  // LocalDateTime notificationSentAt (초기값: null)
          null                                   // LocalDateTime notificationReadAt (초기값: null)
          );

      Notification savedNotification = notificationRepository.save(notification);

      // 저장 후 생성된 ID를 페이로드에 다시 설정 (클라이언트에서 PK가 필요할 경우)
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