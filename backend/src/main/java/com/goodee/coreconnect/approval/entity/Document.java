package com.goodee.coreconnect.approval.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import org.hibernate.annotations.CreationTimestamp;

import com.goodee.coreconnect.approval.enums.ApprovalLineStatus;
import com.goodee.coreconnect.approval.enums.ApprovalLineType;
import com.goodee.coreconnect.approval.enums.DocumentStatus;
import com.goodee.coreconnect.user.entity.User;

import jakarta.persistence.Access;
import jakarta.persistence.AccessType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;

@Entity
@Getter
@Access(AccessType.FIELD)
@Table(name = "document")
public class Document {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "doc_id")
  private Integer id;

  @Column(name = "doc_title", nullable = false, length = 30)
  private String documentTitle;

  @Column(name = "doc_data_json", columnDefinition = "TEXT")
  private String documentDataJson;

  @Enumerated(EnumType.STRING)
  @Column(name = "doc_status", nullable = false, length = 20)
  private DocumentStatus documentStatus = DocumentStatus.DRAFT;

  @CreationTimestamp
  @Column(name = "doc_created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "doc_completed_at")
  private LocalDateTime completedAt;

  @Column(name = "doc_deleted_yn")
  private Boolean docDeletedYn = false;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "temp_id", nullable = false)
  private Template template;

  @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<ApprovalLine> approvalLines = new ArrayList<>();

  @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
  private Set<File> files = new HashSet<>();

  protected Document() {};

  /**
   * 생성 메소드
   * @param template
   * @param user
   * @param documentTitle
   * @param documentContent
   * @return
   */
  public static Document createDocument(Template template, User user, String documentTitle, String documentDataJson) {
    Document d = new Document();
    d.template = template;
    d.user = user;
    d.documentTitle = documentTitle;
    d.documentDataJson = documentDataJson;
    return d;
  }

  /**
   * 문서를 상신하는 메소드
   */
  public void submit() {
    if (this.documentStatus != DocumentStatus.DRAFT)
      throw new IllegalStateException("임시 저장 상태의 문서만 상신할 수 있습니다.");
    
    boolean hasRequiredLine = this.approvalLines.stream()
        .anyMatch(line -> line.getApprovalLineType() == ApprovalLineType.APPROVE);
    
    if (!hasRequiredLine)
      throw new IllegalStateException("결재선(결재 또는 합의)이 지정되지 않은 문서는 상신할 수 없습니다.");

    this.documentStatus = DocumentStatus.IN_PROGRESS;
  }
  
  public void updateDraftDetails(String newTitle, String newDataJson) {
    if (this.documentStatus != DocumentStatus.DRAFT) {
      throw new IllegalStateException("임시저장 상태의 문서만 수정할 수 있습니다.");
    }
    this.documentTitle = newTitle;
    this.documentDataJson = newDataJson;
  }

  /**
   * 문서를 회수하는 메소드 (기안자가 사용)
   */
  public void cancel() {
    if (this.documentStatus != DocumentStatus.IN_PROGRESS)
      throw new IllegalStateException("진행 중인 문서만 회수할 수 있습니다.");
    this.documentStatus = DocumentStatus.DRAFT;
    this.approvalLines.forEach(ApprovalLine::cancel);
  }

  /**
   * 문서를 반려 처리하는 메소드
   */
  public void reject() {
    if (this.documentStatus != DocumentStatus.IN_PROGRESS)
      throw new IllegalStateException("진행 중인 문서가 아닙니다");
    this.documentStatus = DocumentStatus.REJECTED;
    this.completedAt = LocalDateTime.now();
  }

  /**
   * 결재 승인 후 문서 상태 변경 메소드
   */
  public void updateStatusAfterApproval() {
    if (this.documentStatus != DocumentStatus.IN_PROGRESS) return;

    boolean allRequiredLinesProcessd = this.approvalLines.stream()
        .filter(line -> line.getApprovalLineType() == ApprovalLineType.AGREE || line.getApprovalLineType() == ApprovalLineType.APPROVE)
        .allMatch(line -> line.getApprovalLineStatus() != ApprovalLineStatus.WAITING);
    if (allRequiredLinesProcessd)
      this.complete();
    
  }

  /**
   * 문서를 완료 처리하는 메소드 (updateStatusAfterApproval 메소드에서 사용됨)
   */
  public void complete() {
    this.documentStatus = DocumentStatus.COMPLETED;
    this.completedAt = LocalDateTime.now();
  }

  /**
   * 문서에 결재선을 추가합니다.
   * 서비스 레이어에서 이 메소드를 사용.
   */
  public void addApprovalLine(ApprovalLine line) {
    if (line.getDocument() != null && !Objects.equals(line.getDocument(), this)) {
      throw new IllegalArgumentException("결재선이 이미 다른 문서에 속해있습니다.");
    }
    this.approvalLines.add(line);
  }

  /**
   * 문서 삭제 상태 변경 메소드
   * @param deleted
   */
  public void markDeleted(boolean deleted) {
    this.docDeletedYn = deleted;
  }

}
