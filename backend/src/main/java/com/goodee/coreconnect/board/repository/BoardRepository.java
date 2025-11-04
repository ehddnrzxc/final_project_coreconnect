package com.goodee.coreconnect.board.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.goodee.coreconnect.board.entity.Board;

public interface BoardRepository extends JpaRepository<Board, Integer> {

    /** 전체 게시글 조회 (삭제 제외) */
    Page<Board> findByDeletedYnFalse(Pageable pageable);

    /** 
     * 카테고리별 게시글 조회 (삭제 제외) 
     * - 사용자 화면용 페이징 조회
     */
    Page<Board> findByCategoryIdAndDeletedYnFalse(Integer categoryId, Pageable pageable);
    
    /** 
     * 카테고리별 게시글 조회 (삭제 제외)
     * - 내부 로직 처리용 전체 조회 (카테고리 삭제 시 관련 게시글 확인)
     */
    List<Board> findByCategoryIdAndDeletedYnFalse(Integer categoryId);

    /** 사용자 이메일 기반 게시글 조회 (삭제 제외) */
    Page<Board> findByUserEmailAndDeletedYnFalse(String email, Pageable pageable);

    /** 공지글 조회 (삭제 제외) */
    List<Board> findByNoticeYnTrueAndDeletedYnFalse();
    
    /** 상단고정 -> 공지 -> 일반글 순으로 조회 (삭제 제외) */
    @Query("""
        SELECT b FROM Board b
        WHERE b.deletedYn = false
        ORDER BY b.pinned DESC, b.noticeYn DESC, b.createdAt DESC
    """)
    Page<Board> findAllOrderByPinnedNoticeAndCreated(Pageable pageable);
    
    /** 현재 상단고정 게시글 조회용 */
    List<Board> findByPinnedTrueAndDeletedYnFalse();
    

    // ─────────────── 선택형 검색 ───────────────
    /** 제목으로 검색 */
    @Query("""
        SELECT b FROM Board b
        WHERE b.deletedYn = false
          AND LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
        ORDER BY b.createdAt DESC
    """)
    Page<Board> searchByTitle(@Param("keyword") String keyword, Pageable pageable);

    /** 내용으로 검색 */
    @Query("""
        SELECT b FROM Board b
        WHERE b.deletedYn = false
          AND LOWER(b.content) LIKE LOWER(CONCAT('%', :keyword, '%'))
        ORDER BY b.createdAt DESC
    """)
    Page<Board> searchByContent(@Param("keyword") String keyword, Pageable pageable);

    /** 작성자명으로 검색 */
    @Query("""
        SELECT b FROM Board b
        JOIN b.user u
        WHERE b.deletedYn = false
          AND LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
        ORDER BY b.createdAt DESC
    """)
    Page<Board> searchByAuthor(@Param("keyword") String keyword, Pageable pageable);
}
