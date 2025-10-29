package com.goodee.coreconnect.board.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.goodee.coreconnect.board.entity.Board;

public interface BoardRepository extends JpaRepository<Board, Integer> {

    /** 전체 게시글 목록 (삭제 제외) */
    Page<Board> findByDeletedYnFalse(Pageable pageable);

    /** 카테고리별 게시글 목록 (삭제 제외) */
    Page<Board> findByCategoryIdAndDeletedYnFalse(Integer categoryId, Pageable pageable);

    /** 사용자 이메일 기반 게시글 목록 (삭제 제외) */
    Page<Board> findByUserEmailAndDeletedYnFalse(String email, Pageable pageable);

    /** 공지글 목록 (삭제 제외) */
    List<Board> findByNoticeYnTrueAndDeletedYnFalse();

    // ─────────────── 선택형 검색 ───────────────
    /** 제목으로 검색 */
    @Query("""
        SELECT b FROM Board b
        WHERE b.deletedYn = false
          AND LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
    """)
    Page<Board> searchByTitle(@Param("keyword") String keyword, Pageable pageable);

    /** 내용으로 검색 */
    @Query("""
        SELECT b FROM Board b
        WHERE b.deletedYn = false
          AND LOWER(b.content) LIKE LOWER(CONCAT('%', :keyword, '%'))
    """)
    Page<Board> searchByContent(@Param("keyword") String keyword, Pageable pageable);

    /** 작성자명으로 검색 */
    @Query("""
        SELECT b FROM Board b
        JOIN b.user u
        WHERE b.deletedYn = false
          AND LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
    """)
    Page<Board> searchByAuthor(@Param("keyword") String keyword, Pageable pageable);
}
