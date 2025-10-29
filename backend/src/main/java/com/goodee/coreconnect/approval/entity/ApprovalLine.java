package com.goodee.coreconnect.approval.entity;

import java.time.LocalDateTime;

import com.goodee.coreconnect.approval.enums.ApprovalLineStatus;
import com.goodee.coreconnect.approval.enums.ApprovalLineType;
import com.goodee.coreconnect.user.entity.User;

import jakarta.persistence.Access;
import jakarta.persistence.AccessType;
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
import jakarta.persistence.Table;
import lombok.Getter;

@Entity
@Getter
@Access(AccessType.FIELD)
@Table(name = "approval_line")
public class ApprovalLine {
  
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "line_id")
  private Integer id;
  
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "doc_id", nullable = false)
  private Document document;
  
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User approver;
  
  @Column(name = "line_order")
  private int approvalLineOrder;
  
  @Enumerated(EnumType.STRING)
  @Column(name = "line_type")
  private ApprovalLineType approvalLineType;
  
  @Enumerated(EnumType.STRING)
  @Column(name = "line_status", nullable = false, length = 20)
  private ApprovalLineStatus approvalLineStatus; 
  
  @Column(name = "line_comment", length = 255)
  private String approvalLineComment;
  
  @Column(name = "line_processed_at")
  private LocalDateTime approvalLineProcessedAt;
  
  protected ApprovalLine() {};
  
  /**
   * 생성 메소드 (정적 팩토리 메소드)
   * @param document
   * @param approver
   * @param approvalLineOrder
   * @param approvalLineType
   * @return
   */
  public static ApprovalLine createApprovalLine(Document document, User approver, int approvalLineOrder, ApprovalLineType approvalLineType, ApprovalLineStatus approvalLineStatus) {
    ApprovalLine a = new ApprovalLine();
    a.document = document;
    a.approver = approver;
    a.approvalLineOrder = approvalLineOrder;
    a.approvalLineType = approvalLineType;
    a.approvalLineStatus = ApprovalLineStatus.WAITING; // 대기 (스키마 기본값) - WAITING, 승인 - APPROVED, 반려 - REJECTED
    document.addApprovalLine(a);
    return a;
  }
  
  /**
   * 결재를 승인하는 비즈니스 로직
   * @param comment
   */
  public void approve(String comment) {
    if (this.approvalLineStatus != ApprovalLineStatus.WAITING) {
      throw new IllegalStateException("이미 처리된 결재 항목입니다.");
    }
    this.approvalLineStatus = ApprovalLineStatus.APPROVED;
    this.approvalLineComment = comment;
    this.approvalLineProcessedAt = LocalDateTime.now();
  }
  
  /**
   * 결재를 반려하는 비즈니스 로직
   * @param comment
   */
  public void reject(String comment) {
    if (this.approvalLineStatus != ApprovalLineStatus.WAITING)
      throw new IllegalStateException("이미 처리된 결재 항목입니다.");
    this.approvalLineStatus = ApprovalLineStatus.REJECTED;
    this.approvalLineComment = comment;
    this.approvalLineProcessedAt = LocalDateTime.now();
  }
  
  /**
   * 결재 처리를 취소하는 로직
   * 결재 상태를 다시 WAITING으로 초기화
   */
  public void cancel() {
    if (this.approvalLineStatus != ApprovalLineStatus.WAITING) {
      this.approvalLineStatus = ApprovalLineStatus.WAITING;
      this.approvalLineComment = null;
      this.approvalLineProcessedAt = null;
    }
  }

}
