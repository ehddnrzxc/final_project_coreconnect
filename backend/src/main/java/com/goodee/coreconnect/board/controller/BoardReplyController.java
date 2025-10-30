package com.goodee.coreconnect.board.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.goodee.coreconnect.board.dto.request.BoardReplyRequestDTO;
import com.goodee.coreconnect.board.dto.response.BoardReplyResponseDTO;
import com.goodee.coreconnect.board.service.BoardReplyService;
import com.goodee.coreconnect.common.dto.response.ResponseDTO;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/board-reply")
@RequiredArgsConstructor
public class BoardReplyController {

    private final BoardReplyService replyService;

    /** 댓글 등록 */
    @PostMapping
    public ResponseEntity<ResponseDTO<BoardReplyResponseDTO>> createReply(
            @RequestBody BoardReplyRequestDTO dto,
            @AuthenticationPrincipal String email
    ) {
        BoardReplyResponseDTO created = replyService.createReply(dto, email);

        ResponseDTO<BoardReplyResponseDTO> res = ResponseDTO.<BoardReplyResponseDTO>builder()
                                                            .status(HttpStatus.CREATED.value())
                                                            .message("댓글이 등록되었습니다.")
                                                            .data(created)
                                                            .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    /** 댓글 수정 (본인만 가능) */
    @PutMapping("/{replyId}")
    public ResponseEntity<ResponseDTO<BoardReplyResponseDTO>> updateReply(
            @PathVariable("replyId") Integer replyId,
            @RequestBody BoardReplyRequestDTO dto,
            @AuthenticationPrincipal String email
    ) {
        BoardReplyResponseDTO updated = replyService.updateReply(replyId, dto, email);

        ResponseDTO<BoardReplyResponseDTO> res = ResponseDTO.<BoardReplyResponseDTO>builder()
                                                            .status(HttpStatus.OK.value())
                                                            .message("댓글이 수정되었습니다.")
                                                            .data(updated)
                                                            .build();

        return ResponseEntity.ok(res);
    }

    /** 댓글 삭제 (Soft Delete, 본인만 가능) */
    @DeleteMapping("/{replyId}")
    public ResponseEntity<ResponseDTO<Void>> deleteReply(
            @PathVariable("replyId") Integer replyId,
            @AuthenticationPrincipal String email
    ) {
        replyService.softDeleteReply(replyId, email);

        ResponseDTO<Void> res = ResponseDTO.<Void>builder()
                                           .status(HttpStatus.NO_CONTENT.value())
                                           .message("댓글이 삭제되었습니다.")
                                           .build();

        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(res);
    }

    /** 게시글별 댓글 목록 조회 (대댓글 포함) */
    @GetMapping("/board/{boardId}")
    public ResponseEntity<ResponseDTO<List<BoardReplyResponseDTO>>> getRepliesByBoard(
            @PathVariable("boardId") Integer boardId
    ) {
        List<BoardReplyResponseDTO> replies = replyService.getRepliesByBoard(boardId);

        ResponseDTO<List<BoardReplyResponseDTO>> res = ResponseDTO.<List<BoardReplyResponseDTO>>builder()
                                                                  .status(HttpStatus.OK.value())
                                                                  .message("댓글 목록 조회 성공")
                                                                  .data(replies)
                                                                  .build();

        return ResponseEntity.ok(res);
    }
}