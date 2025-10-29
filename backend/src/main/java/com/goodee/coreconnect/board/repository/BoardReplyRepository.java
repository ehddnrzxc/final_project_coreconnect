package com.goodee.coreconnect.board.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.board.entity.BoardReply;

public interface BoardReplyRepository extends JpaRepository<BoardReply, Integer> {

    /** 특정 게시글의 댓글 목록 (삭제 제외) */
    List<BoardReply> findByBoardIdAndDeletedYnFalseOrderByCreatedAtAsc(Integer boardId);

    /** 부모 댓글 기준으로 대댓글 목록 조회 */
    List<BoardReply> findByParentReplyIdAndDeletedYnFalseOrderByCreatedAtAsc(Integer parentReplyId);

}
