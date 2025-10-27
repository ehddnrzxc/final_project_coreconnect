package com.goodee.coreconnect.approval.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.approval.entity.ApprovalLine;
import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.approval.enums.DocumentStatus;
import com.goodee.coreconnect.user.entity.User;

public interface DocumentRepository extends JpaRepository<Document, Integer>{

  /**
   * 내가 작성한 문서 목록 조회 (작성자 기준)
   * @param user
   * @return
   */
  List<Document> findByUserOrderByCreatedAtDesc(User user);
  
  /**
   * 특정 상태의 문서 목록 조회 (상태 기준)
   * @param documentStatus
   * @return
   */
  List<Document> findByDocumentStatusOrderByCreatedAtDesc(DocumentStatus documentStatus);
  
  /**
   * 내가 결재할 문서 목록을 찾기 위해, 특정 결재선을 포함하는 문서들을 조회
   * @param approvalLines
   * @return
   */
  List<Document> findByApprovalLinesIn(List<ApprovalLine> approvalLines);
  
}
