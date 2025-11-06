package com.goodee.coreconnect.board.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.goodee.coreconnect.board.entity.BoardReply;

public interface BoardReplyRepository extends JpaRepository<BoardReply, Integer> {

    /** 부모 댓글 기준으로 대댓글 목록 조회 */
    List<BoardReply> findByParentReplyIdAndDeletedYnFalseOrderByCreatedAtAsc(Integer parentReplyId);

    /** 특정 게시글의 댓글 목록 (대댓글 유지) */
    @Query("SELECT r FROM BoardReply r WHERE r.board.id = :boardId ORDER BY r.createdAt ASC")
    List<BoardReply> findAllByBoardIdIncludeDeleted(@Param("boardId") Integer boardId);
}
