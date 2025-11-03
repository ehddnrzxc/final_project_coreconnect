package com.goodee.coreconnect.approval.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.goodee.coreconnect.approval.entity.ApprovalLine;
import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.approval.enums.DocumentStatus;
import com.goodee.coreconnect.user.entity.User;

import jakarta.persistence.LockModeType;

public interface DocumentRepository extends JpaRepository<Document, Integer>{

  /**
   * 내가 작성한 문서 목록 조회 (작성자 기준)
   * @param user
   * @return
   */
  List<Document> findByUserAndDocDeletedYnOrderByCreatedAtDesc(User user, Boolean docDeletedYn);

  /**
   * 내가 작성한 문서 목록을 상태별로 조회 (임시저장함용)
   */
  List<Document> findByUserAndDocumentStatusAndDocDeletedYnOrderByCreatedAtDesc(
      User user, 
      DocumentStatus documentStatus, 
      Boolean docDeletedYn
      );

  /**
   * (N+1 문제 해결) 문서 상세 조회 시 필요한 모든 연관 엔티티를 fetch join
   */
  @Query("""
      SELECT d FROM Document d
      JOIN FETCH d.user
      JOIN FETCH d.template
      LEFT JOIN FETCH d.approvalLines al
      LEFT JOIN FETCH al.approver
      LEFT JOIN FETCH d.files
      WHERE d.id = :documentId
      """)
  Optional<Document> findDocumentDetailById(@Param("documentId") Integer documentId);

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

  /**
   * 결재/반려 시 사용할 비관적 락 (동시성 문제를 해결하기 위해 추가)
   */
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT d FROM Document d WHERE d.id = :documentId")
  Optional<Document> findByIdForUpdate(@Param("documentId") Integer documentId);

  /**
   * 내 상신함 목록을 상태별로 조회
   */
  @Query("""
      SELECT d From Document d
      JOIN FETCH d.user u
      JOIN FETCH d.template t
      WHERE d.user = :user
      AND d.docDeletedYn = :deletedYn
      AND d.documentStatus IN :statuses
      ORDER BY d.createdAt DESC
      """)
  List<Document> findByUserAndStatusInWithJoins(@Param("user") User user, @Param("statuses") List<DocumentStatus> statuses, @Param("deletedYn") Boolean deletedYn);

}
