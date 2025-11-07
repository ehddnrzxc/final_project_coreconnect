package com.goodee.coreconnect.board.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.board.dto.request.BoardReplyRequestDTO;
import com.goodee.coreconnect.board.dto.response.BoardReplyResponseDTO;
import com.goodee.coreconnect.board.service.BoardReplyService;
import com.goodee.coreconnect.common.dto.response.ResponseDTO;
import com.goodee.coreconnect.security.userdetails.CustomUserDetails;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "Board Reply API", description = "게시글 댓글 및 대댓글 관리 API")
@RestController
@RequestMapping("/api/v1/board-reply")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class BoardReplyController {

    private final BoardReplyService replyService;

    @Operation(summary = "댓글 등록", description = "로그인한 사용자가 댓글을 등록합니다.")
    @PostMapping
    public ResponseEntity<ResponseDTO<BoardReplyResponseDTO>> createReply(
            @RequestBody BoardReplyRequestDTO dto,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        String email = user.getEmail();
        BoardReplyResponseDTO created = replyService.createReply(dto, email);

        ResponseDTO<BoardReplyResponseDTO> res = ResponseDTO.<BoardReplyResponseDTO>builder()
                                                            .status(HttpStatus.CREATED.value())
                                                            .message("댓글이 등록되었습니다.")
                                                            .data(created)
                                                            .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @Operation(summary = "댓글 수정", description = "본인이 작성한 댓글을 수정합니다.")
    @PutMapping("/{replyId}")
    public ResponseEntity<ResponseDTO<BoardReplyResponseDTO>> updateReply(
            @PathVariable("replyId") Integer replyId,
            @RequestBody BoardReplyRequestDTO dto,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        String email = user.getEmail();
        BoardReplyResponseDTO updated = replyService.updateReply(replyId, dto, email);

        ResponseDTO<BoardReplyResponseDTO> res = ResponseDTO.<BoardReplyResponseDTO>builder()
                                                            .status(HttpStatus.OK.value())
                                                            .message("댓글이 수정되었습니다.")
                                                            .data(updated)
                                                            .build();

        return ResponseEntity.ok(res);
    }

    @Operation(summary = "댓글 삭제", description = "본인이 작성한 댓글을 Soft Delete 방식으로 삭제합니다.")
    @DeleteMapping("/{replyId}")
    public ResponseEntity<ResponseDTO<Void>> deleteReply(
            @PathVariable("replyId") Integer replyId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        String email = user.getEmail();
        replyService.softDeleteReply(replyId, email);

        ResponseDTO<Void> res = ResponseDTO.<Void>builder()
                                           .status(HttpStatus.NO_CONTENT.value())
                                           .message("댓글이 삭제되었습니다.")
                                           .build();

        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(res);
    }

    @Operation(summary = "게시글별 댓글 목록 조회", description = "게시글 ID 기준으로 댓글 및 대댓글을 모두 조회합니다.")
    @GetMapping("/board/{boardId}")
    public ResponseEntity<ResponseDTO<List<BoardReplyResponseDTO>>> getRepliesByBoard(@PathVariable("boardId") Integer boardId) {
        List<BoardReplyResponseDTO> replies = replyService.getRepliesByBoard(boardId);

        ResponseDTO<List<BoardReplyResponseDTO>> res = ResponseDTO.<List<BoardReplyResponseDTO>>builder()
                                                                  .status(HttpStatus.OK.value())
                                                                  .message("댓글 목록 조회 성공")
                                                                  .data(replies)
                                                                  .build();

        return ResponseEntity.ok(res);
    }
}