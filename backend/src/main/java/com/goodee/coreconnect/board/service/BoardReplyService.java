package com.goodee.coreconnect.board.service;

import java.util.List;

import com.goodee.coreconnect.board.dto.request.BoardReplyRequestDTO;
import com.goodee.coreconnect.board.dto.response.BoardReplyResponseDTO;

public interface BoardReplyService {

    // 댓글 등록
    BoardReplyResponseDTO createReply(BoardReplyRequestDTO dto, Integer userId);

    // 댓글 수정
    BoardReplyResponseDTO updateReply(Integer replyId, String content);

    // 댓글 삭제 (deletedYn = true)
    BoardReplyResponseDTO softDeleteReply(Integer replyId);

    // 게시글별 댓글 목록
    List<BoardReplyResponseDTO> getRepliesByBoard(Integer boardId);

    // 특정 사용자가 작성한 댓글 목록
    List<BoardReplyResponseDTO> getRepliesByUser(Integer userId);

    // 특정 댓글의 대댓글 목록
    List<BoardReplyResponseDTO> getRepliesByParent(Integer parentReplyId);
}
