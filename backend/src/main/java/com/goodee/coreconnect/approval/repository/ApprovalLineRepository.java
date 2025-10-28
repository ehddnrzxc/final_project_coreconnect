package com.goodee.coreconnect.approval.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.goodee.coreconnect.approval.entity.ApprovalLine;
import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.approval.enums.ApprovalLineStatus;
import com.goodee.coreconnect.approval.enums.DocumentStatus;
import com.goodee.coreconnect.user.entity.User;

public interface ApprovalLineRepository extends JpaRepository<ApprovalLine, Integer>{

  /**
   * 내가 결재할 문서 조회
   * @param approver 결재자
   * @param status 'WAITING' 상태 (결재대기)
   * @return 결재 대기 중인 결재선 목록
   */
  @Query("SELECT al FROM ApprovalLine al " +
      "JOIN FETCH al.document d " + // Document를 함께 조회 (N+1 방지)
      "JOIN FETCH d.user " + // Document의 작성자도 함께 조회 (DTO 변환용)
      "WHERE al.approver = :approver " +
      "AND al.approvalLineStatus = :status " +
      "AND d.documentStatus = :docStatus " +
      "AND (d.docDeletedYn IS NULL OR d.docDeletedYn = false) " +
      "ORDER BY d.createdAt ASC")
  List<ApprovalLine> findMyTasks(
      @Param("approver") User approver, 
      @Param("status") ApprovalLineStatus status, 
      @Param("docStatus") DocumentStatus docStatus
      );

  /**
   * 특정 문서에 속한 모든 결재선 조회
   * @param document
   * @return
   */
  List<ApprovalLine> findByDocumentOrderByApprovalLineOrderAsc(Document document);

}
