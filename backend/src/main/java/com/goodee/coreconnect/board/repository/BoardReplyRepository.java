package com.goodee.coreconnect.board.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.goodee.coreconnect.board.entity.BoardReply;

@Repository
public interface BoardReplyRepository extends JpaRepository<BoardReply, Integer> {

    // 특정 게시글의 댓글 목록
    List<BoardReply> getRepliesByBoardId(Integer boardId);

    // 특정 사용자가 작성한 댓글 목록
    List<BoardReply> getRepliesByUserId(Integer userId);

    // 특정 댓글의 대댓글 목록
    List<BoardReply> getRepliesByParentReplyId(Integer parentReplyId);
}
