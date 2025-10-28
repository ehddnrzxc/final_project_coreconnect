package com.goodee.coreconnect.board.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.goodee.coreconnect.board.entity.BoardReply;

public interface BoardReplyRepository extends JpaRepository<BoardReply, Integer> {

    // 특정 게시글의 댓글 목록
    List<BoardReply> findByBoardId(Integer boardId);

    // 특정 사용자가 작성한 댓글 목록
    List<BoardReply> findByUserId(Integer userId);

    // 특정 댓글의 대댓글 목록
    List<BoardReply> findByParentReplyId(Integer parentReplyId);
}
