package com.goodee.coreconnect.board.controller;

import com.goodee.coreconnect.board.dto.request.BoardRequestDTO;
import com.goodee.coreconnect.board.dto.response.BoardResponseDTO;
import com.goodee.coreconnect.board.service.BoardService;
import com.goodee.coreconnect.common.dto.response.ResponseDTO;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 게시글 관련 REST 컨트롤러
 * - 등록, 수정, 삭제, 조회, 검색 등 게시판 주요 기능 담당
 */
@RestController
@RequestMapping("/api/v1/boards")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    /** 게시글 등록 (로그인 사용자 기준) */
    @PostMapping
    public ResponseEntity<ResponseDTO<BoardResponseDTO>> createBoard(
            @AuthenticationPrincipal String email,
            @RequestBody BoardRequestDTO dto
    ) {
        BoardResponseDTO created = boardService.createBoard(dto, email);

        ResponseDTO<BoardResponseDTO> res = ResponseDTO.<BoardResponseDTO>builder()
                                                       .status(HttpStatus.CREATED.value())
                                                       .message("게시글이 등록되었습니다.")
                                                       .data(created)
                                                       .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    /** 게시글 수정 */
    @PutMapping("/{boardId}")
    public ResponseEntity<ResponseDTO<BoardResponseDTO>> updateBoard(
            @PathVariable("boardId") Integer boardId,
            @RequestBody BoardRequestDTO dto
    ) {
        BoardResponseDTO response = boardService.updateBoard(boardId, dto);

        ResponseDTO<BoardResponseDTO> res = ResponseDTO.<BoardResponseDTO>builder()
                                                       .status(HttpStatus.OK.value())
                                                       .message("게시글이 수정되었습니다.")
                                                       .data(response)
                                                       .build();

        return ResponseEntity.ok(res);
    }

    /** 게시글 삭제 (Soft Delete) */
    @DeleteMapping("/{boardId}")
    public ResponseEntity<ResponseDTO<Void>> deleteBoard(@PathVariable("boardId") Integer boardId) {
        boardService.softDeleteBoard(boardId);

        ResponseDTO<Void> res = ResponseDTO.<Void>builder()
                                           .status(HttpStatus.NO_CONTENT.value())
                                           .message("게시글이 삭제되었습니다.")
                                           .data(null)
                                           .build();

        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(res);
    }

    /** 게시글 상세 조회 */
    @GetMapping("/{boardId}")
    public ResponseEntity<ResponseDTO<BoardResponseDTO>> getBoardDetail(
            @PathVariable("boardId") Integer boardId
    ) {
        BoardResponseDTO response = boardService.getBoardById(boardId);

        ResponseDTO<BoardResponseDTO> res = ResponseDTO.<BoardResponseDTO>builder()
                                                       .status(HttpStatus.OK.value())
                                                       .message("게시글 상세 조회 성공")
                                                       .data(response)
                                                       .build();

        return ResponseEntity.ok(res);
    }

    /** 전체 게시글 목록 */
    @GetMapping
    public ResponseEntity<ResponseDTO<Page<BoardResponseDTO>>> getAllBoards(
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        Page<BoardResponseDTO> page = boardService.getAllBoards(pageable);

        ResponseDTO<Page<BoardResponseDTO>> res = ResponseDTO.<Page<BoardResponseDTO>>builder()
                                                             .status(HttpStatus.OK.value())
                                                             .message("전체 게시글 목록 조회 성공")
                                                             .data(page)
                                                             .build();

        return ResponseEntity.ok(res);
    }

    /** 카테고리별 게시글 목록 */
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<ResponseDTO<Page<BoardResponseDTO>>> getBoardsByCategory(
            @PathVariable("categoryId") Integer categoryId,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        Page<BoardResponseDTO> page = boardService.getBoardsByCategory(categoryId, pageable);

        ResponseDTO<Page<BoardResponseDTO>> res = ResponseDTO.<Page<BoardResponseDTO>>builder()
                                                             .status(HttpStatus.OK.value())
                                                             .message("카테고리별 게시글 목록 조회 성공")
                                                             .data(page)
                                                             .build();

        return ResponseEntity.ok(res);
    }

    /** 사용자 본인의 게시글 목록 (이메일 기반) */
    @GetMapping("/user")
    public ResponseEntity<ResponseDTO<Page<BoardResponseDTO>>> getBoardsByUser(
            @AuthenticationPrincipal String email,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        Page<BoardResponseDTO> page = boardService.getBoardsByUser(email, pageable);

        ResponseDTO<Page<BoardResponseDTO>> res = ResponseDTO.<Page<BoardResponseDTO>>builder()
                                                             .status(HttpStatus.OK.value())
                                                             .message("내 게시글 목록 조회 성공")
                                                             .data(page)
                                                             .build();

        return ResponseEntity.ok(res);
    }

    /** 공지글 목록 조회 */
    @GetMapping("/notices")
    public ResponseEntity<ResponseDTO<List<BoardResponseDTO>>> getNoticeBoards() {
        List<BoardResponseDTO> list = boardService.getNoticeBoards();

        ResponseDTO<List<BoardResponseDTO>> res = ResponseDTO.<List<BoardResponseDTO>>builder()
                                                             .status(HttpStatus.OK.value())
                                                             .message("공지글 목록 조회 성공")
                                                             .data(list)
                                                             .build();

        return ResponseEntity.ok(res);
    }

    /** 검색 (제목, 내용, 작성자명 중 선택형) */
    @GetMapping("/search")
    public ResponseEntity<ResponseDTO<Page<BoardResponseDTO>>> searchBoards(
            @RequestParam("type") String type,
            @RequestParam("keyword") String keyword,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        Page<BoardResponseDTO> result = boardService.searchBoards(type, keyword, pageable);

        ResponseDTO<Page<BoardResponseDTO>> res = ResponseDTO.<Page<BoardResponseDTO>>builder()
                                                             .status(HttpStatus.OK.value())
                                                             .message("게시글 검색 성공")
                                                             .data(result)
                                                             .build();

        return ResponseEntity.ok(res);
    }
}