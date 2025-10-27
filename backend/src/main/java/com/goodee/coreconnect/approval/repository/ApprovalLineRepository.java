package com.goodee.coreconnect.approval.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.approval.entity.ApprovalLine;
import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.approval.enums.ApprovalLineStatus;
import com.goodee.coreconnect.user.entity.User;

public interface ApprovalLineRepository extends JpaRepository<ApprovalLine, Integer>{

  /**
   * 내가 결재할 문서 조회
   * @param approver 결재자
   * @param status 'PENDING' 상태 (결재대기)
   * @return 결재 대기 중인 결재선 목록
   */
  List<ApprovalLine> findByApproverAndApprovalLineStatusOrderByDocumentCreatedAt(User approver, ApprovalLineStatus status);

  /**
   * 특정 문서에 속한 모든 결재선 조회
   * @param document
   * @return
   */
  List<ApprovalLine> findByDocumentOrderByApprovalLineOrderAsc(Document document);

}
