package com.goodee.coreconnect.approval.service;

import java.io.IOException;
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
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

/**
 * 결재 서비스 구현체
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // CUD 작업에는 @Transactional을 별도 명시
public class ApprovalServiceImpl implements ApprovalService {

  private final DocumentRepository documentRepository;
  private final TemplateRepository templateRepository;
  private final UserRepository userRepository;
  private final ApprovalLineRepository approvalLineRepository;
  private final S3Service s3Service;

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

}
