package com.goodee.coreconnect.board.service;

import java.util.List;

import com.goodee.coreconnect.board.dto.request.BoardReplyRequestDTO;
import com.goodee.coreconnect.board.dto.response.BoardReplyResponseDTO;

public interface BoardReplyService {

    /** 댓글 등록 */
    BoardReplyResponseDTO createReply(BoardReplyRequestDTO dto, String email);

    /** 댓글 수정 */
    BoardReplyResponseDTO updateReply(Integer replyId, BoardReplyRequestDTO dto, String email);

    /** 댓글 삭제 (Soft Delete) */
    void softDeleteReply(Integer replyId, String email);

    /** 게시글별 댓글 목록 (대댓글 포함) */
    List<BoardReplyResponseDTO> getRepliesByBoard(Integer boardId);
}
