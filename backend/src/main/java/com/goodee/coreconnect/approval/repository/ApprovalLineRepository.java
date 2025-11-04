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
   * 특정 문서에 속한 모든 결재선 조회
   * @param document
   * @return
   */
  List<ApprovalLine> findByDocumentOrderByApprovalLineOrderAsc(Document document);

  /**
   * "현재 내 차례"인 결재선만 정확히 조회 (N+1 해결)
   * JPQL 서브쿼리를 사용하여, WAITING 상태인 결재선 중 가장 순서(order)가 빠른 결재선이
   * '나'인 경우만 조회합니다.
   */
  @Query("""
      SELECT al FROM ApprovalLine al
      JOIN FETCH al.document d
      JOIN FETCH d.user
      WHERE al.approver = :approver
      AND al.approvalLineStatus = :status
      AND d.documentStatus = :docStatus
      AND (d.docDeletedYn IS NULL OR d.docDeletedYn = false)
      AND al.approvalLineOrder = (
          SELECT MIN(al2.approvalLineOrder)
          FROM ApprovalLine al2
          WHERE al2.document = al.document
          AND al2.approvalLineStatus = :status
         )
      ORDER BY d.createdAt ASC
      """)
  List<ApprovalLine> findMyCurrentTasks(
      @Param("approver") User approver, 
      @Param("status") ApprovalLineStatus status, 
      @Param("docStatus") DocumentStatus docStatus
      );
}