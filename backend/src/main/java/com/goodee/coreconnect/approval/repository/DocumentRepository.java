package com.goodee.coreconnect.approval.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
  @Query(value = """
      SELECT DISTINCT d FROM Document d
      JOIN FETCH d.user u
      LEFT JOIN FETCH u.department
      JOIN FETCH d.template
      LEFT JOIN FETCH d.approvalLines al
      LEFT JOIN FETCH al.approver
      WHERE d.user = :user
      AND d.docDeletedYn = :deletedYn
      AND d.documentStatus <> 'DRAFT'
      ORDER BY d.createdAt DESC
      """,
      countQuery = """
      SELECT count(d) FROM Document d
      WHERE d.user = :user
      AND d.docDeletedYn = :deletedYn
      AND d.documentStatus <> 'DRAFT'
      """)
  Page<Document> findByUserAndDocDeletedYnOrderByCreatedAtDesc(
      @Param("user") User user,
      @Param("deletedYn") Boolean docDeletedYn,
      Pageable pageable
      
  );

  /**
   * 내가 작성한 문서 목록을 상태별로 조회 (임시저장함용)
   */
  @Query("""
      SELECT DISTINCT d FROM Document d
      JOIN FETCH d.user u 
      LEFT JOIN FETCH u.department
      JOIN FETCH d.template
      LEFT JOIN FETCH d.approvalLines al
      LEFT JOIN FETCH al.approver
      WHERE d.user = :user
      AND d.documentStatus = :documentStatus
      AND d.docDeletedYn = :deletedYn
      ORDER BY d.createdAt DESC
      """)
  List<Document> findByUserAndDocumentStatusAndDocDeletedYnOrderByCreatedAtDesc(
      @Param("user") User user, 
      @Param("documentStatus") DocumentStatus documentStatus, 
      @Param("deletedYn") Boolean docDeletedYn
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
      SELECT DISTINCT d FROM Document d
      JOIN FETCH d.user u
      LEFT JOIN FETCH u.department
      JOIN FETCH d.template t
      LEFT JOIN FETCH d.approvalLines al
      LEFT JOIN FETCH al.approver
      WHERE d.user = :user
      AND d.docDeletedYn = :deletedYn
      AND d.documentStatus IN :statuses
      ORDER BY d.createdAt DESC
      """)
  List<Document> findByUserAndStatusInWithJoins(@Param("user") User user, @Param("statuses") List<DocumentStatus> statuses, @Param("deletedYn") Boolean deletedYn);
  
  /**
   * 중복 검사를 위해 특정 유저의 특정 템플릿 문서 중 유효한(진행중, 완료) 문서 조회
   * @param user
   * @param templateId
   * @param statuses
   * @return
   */
  @Query("""
      SELECT d FROM Document d
      WHERE d.user = :user
      AND d.template.id = :templateId
      AND d.docDeletedYn = false
      AND d.documentStatus IN :statuses
      """)
  List<Document> findByUserAndTemplateIdAndStatusIn(@Param("user") User user, @Param("templateId") Integer templateId, @Param("statuses") List<DocumentStatus> statuses);

}
