package com.goodee.coreconnect.board.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.goodee.coreconnect.board.entity.Board;

public interface BoardRepository extends JpaRepository<Board, Integer> {

    // ─────────────── 기본 조회 ───────────────

    /** 
     * 전체 게시글 조회 
     * - 조건: 삭제되지 않은 게시글 (deletedYn = false)
     * - 정렬: 기본 Pageable 기준
     */
    Page<Board> findByDeletedYnFalse(Pageable pageable);

    /** 
     * 카테고리별 게시글 전체 조회 
     * - 조건: 삭제되지 않은 게시글 (deletedYn = false)
     * - 용도: 카테고리 삭제 시 관련 게시글 확인용
     */
    List<Board> findByCategoryIdAndDeletedYnFalse(Integer categoryId);

    /** 
     * 사용자 이메일 기준 게시글 조회 
     * - 조건: 삭제되지 않은 게시글 (deletedYn = false)
     * - 정렬: 기본 Pageable 기준
     */
    Page<Board> findByUserEmailAndDeletedYnFalse(String email, Pageable pageable);

    /** 
     * 공지글 목록 조회 
     * - 조건: 공지글(noticeYn = true) AND 삭제되지 않음
     * - 정렬 우선순위:
     *   1) 상단고정(pinned) 내림차순
     *   2) 작성일(createdAt) 내림차순
     */
    List<Board> findByNoticeYnTrueAndDeletedYnFalseOrderByPinnedDescCreatedAtDesc();


    // ─────────────── 전체 게시판 정렬 조회 ───────────────

    /** 
     * 전체 게시글 정렬 조회 (최신순)
     * - 조건: 삭제되지 않은 게시글 (deletedYn = false)
     * - 정렬 우선순위:
     *   1) 상단고정(pinned) 내림차순
     *   2) 공지글(noticeYn) 내림차순
     *   3) 작성일(createdAt) 내림차순
     */
    @Query("""
        SELECT b FROM Board b
        WHERE b.deletedYn = false
        ORDER BY b.pinned DESC, b.noticeYn DESC, b.createdAt DESC
    """)
    Page<Board> findAllOrderByPinnedNoticeAndCreated(Pageable pageable);

    /** 
     * 전체 게시글 정렬 조회 (조회순)
     * - 조건: 삭제되지 않은 게시글 (deletedYn = false)
     * - 정렬 우선순위:
     *   1) 상단고정(pinned) 내림차순
     *   2) 공지글(noticeYn) 내림차순
     *   3) 조회수(viewCount) 내림차순
     *   4) 작성일(createdAt) 내림차순
     */
    @Query("""
        SELECT b FROM Board b
        WHERE b.deletedYn = false
        ORDER BY b.pinned DESC, b.noticeYn DESC, b.viewCount DESC, b.createdAt DESC
    """)
    Page<Board> findAllOrderByPinnedNoticeAndViews(Pageable pageable);


    // ─────────────── 카테고리별 정렬 조회 ───────────────

    /** 
     * 카테고리별 게시글 정렬 조회 (최신순)
     * - 조건: 삭제되지 않은 게시글 (deletedYn = false)
     * - 정렬 우선순위:
     *   1) 상단고정(pinned) 내림차순
     *   2) 공지글(noticeYn) 내림차순
     *   3) 작성일(createdAt) 내림차순
     */
    @Query("""
        SELECT b FROM Board b
        WHERE b.deletedYn = false AND b.category.id = :categoryId
        ORDER BY b.pinned DESC, b.noticeYn DESC, b.createdAt DESC
    """)
    Page<Board> findByCategoryIdOrdered(@Param("categoryId") Integer categoryId, Pageable pageable);

    /** 
     * 카테고리별 게시글 정렬 조회 (조회순)
     * - 조건: 삭제되지 않은 게시글 (deletedYn = false)
     * - 정렬 우선순위:
     *   1) 상단고정(pinned) 내림차순
     *   2) 공지글(noticeYn) 내림차순
     *   3) 조회수(viewCount) 내림차순
     *   4) 작성일(createdAt) 내림차순
     */
    @Query("""
        SELECT b FROM Board b
        WHERE b.deletedYn = false AND b.category.id = :categoryId
        ORDER BY b.pinned DESC, b.noticeYn DESC, b.viewCount DESC, b.createdAt DESC
    """)
    Page<Board> findByCategoryOrderedByViews(@Param("categoryId") Integer categoryId, Pageable pageable);


    // ─────────────── 상단고정 관련 ───────────────

    /** 
     * 현재 상단고정 상태의 게시글 목록 조회
     * - 조건: pinned = true AND deletedYn = false
     */
    List<Board> findByPinnedTrueAndDeletedYnFalse();

    /** 
     * 카테고리별 상단고정 게시글 존재 여부 확인
     * - 조건: pinned = true AND deletedYn = false
     * - 용도: 카테고리당 고정글 1개 제한
     */
    Optional<Board> findByCategoryIdAndPinnedTrueAndDeletedYnFalse(Integer categoryId);


    // ─────────────── 검색 기능 ───────────────

    /** 
     * 제목으로 검색
     * - 조건: 삭제되지 않은 게시글 (deletedYn = false)
     * - 검색: title LIKE %keyword%
     * - 정렬: 작성일(createdAt) 내림차순
     */
    @Query("""
        SELECT b FROM Board b
        WHERE b.deletedYn = false
          AND LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
        ORDER BY b.createdAt DESC
    """)
    Page<Board> searchByTitle(@Param("keyword") String keyword, Pageable pageable);

    /** 
     * 내용으로 검색
     * - 조건: 삭제되지 않은 게시글 (deletedYn = false)
     * - 검색: content LIKE %keyword%
     * - 정렬: 작성일(createdAt) 내림차순
     */
    @Query("""
        SELECT b FROM Board b
        WHERE b.deletedYn = false
          AND LOWER(b.content) LIKE LOWER(CONCAT('%', :keyword, '%'))
        ORDER BY b.createdAt DESC
    """)
    Page<Board> searchByContent(@Param("keyword") String keyword, Pageable pageable);

    /** 
     * 작성자명으로 검색
     * - 조건: 삭제되지 않은 게시글 (deletedYn = false)
     * - 검색: user.name LIKE %keyword%
     * - 정렬: 작성일(createdAt) 내림차순
     */
    @Query("""
        SELECT b FROM Board b
        JOIN b.user u
        WHERE b.deletedYn = false
          AND LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
        ORDER BY b.createdAt DESC
    """)
    Page<Board> searchByAuthor(@Param("keyword") String keyword, Pageable pageable);
}
