package com.goodee.coreconnect.board.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.board.dto.request.BoardRequestDTO;
import com.goodee.coreconnect.board.dto.response.BoardResponseDTO;
import com.goodee.coreconnect.board.service.BoardService;
import com.goodee.coreconnect.common.dto.response.ResponseDTO;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "Board API", description = "게시판 및 공지사항 관련 기능 API")
@RestController
@RequestMapping("/api/v1/board")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")  // Swagger에서 JWT 토큰 인증 헤더 활성화
public class BoardController {

    private final BoardService boardService;

    @Operation(summary = "게시글 등록", description = "로그인한 사용자가 새 게시글을 등록합니다.")
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

    @Operation(summary = "게시글 수정", description = "기존 게시글의 내용을 수정합니다.")
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

    @Operation(summary = "게시글 삭제", description = "게시글을 Soft Delete 방식으로 삭제합니다.")
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

    @Operation(summary = "게시글 상세 조회", description = "게시글의 상세 내용을 조회합니다. (조회수가 증가하고, 최근 본 게시글로 저장됩니다.)")
    @GetMapping("/{boardId}")
    public ResponseEntity<ResponseDTO<BoardResponseDTO>> getBoardDetail(
            @AuthenticationPrincipal String email, 
            @PathVariable("boardId") Integer boardId
    ) {
        BoardResponseDTO response = boardService.getBoardById(boardId, email); 

        ResponseDTO<BoardResponseDTO> res = ResponseDTO.<BoardResponseDTO>builder()
                                                       .status(HttpStatus.OK.value())
                                                       .message("게시글 상세 조회 성공")
                                                       .data(response)
                                                       .build();

        return ResponseEntity.ok(res);
    }

    /** ✅ 수정1: 전체 게시글 목록 조회 (정렬 통합 버전)
     * sortType = latest(최신순), views(조회순)
     * 상단고정 → 공지 → 일반글 순으로 정렬됨
     */
    @Operation(summary = "전체 게시글 목록 조회 (정렬 포함)", 
               description = "sortType = latest(최신순), views(조회순). 상단고정 → 공지 → 일반글 순으로 조회합니다.") // 수정1
    @GetMapping("/ordered") // 수정1
    public ResponseEntity<ResponseDTO<Page<BoardResponseDTO>>> getBoards(
            @RequestParam(name = "sortType", defaultValue = "latest") String sortType, // 수정1
            @PageableDefault(size = 10) Pageable pageable // 수정1
    ) {
        Page<BoardResponseDTO> page = boardService.getBoardsSorted(sortType, pageable); // 수정1

        ResponseDTO<Page<BoardResponseDTO>> res = ResponseDTO.<Page<BoardResponseDTO>>builder()
                                                             .status(HttpStatus.OK.value())
                                                             .message("게시글 목록 조회 성공 (" + sortType + ")") // 수정1
                                                             .data(page)
                                                             .build();

        return ResponseEntity.ok(res);
    }

    @Operation(summary = "카테고리별 게시글 조회", description = "특정 카테고리의 게시글 목록을 조회합니다.")
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<ResponseDTO<Page<BoardResponseDTO>>> getBoardsByCategory(
            @PathVariable("categoryId") Integer categoryId,
            @RequestParam(name = "sortType", defaultValue = "latest") String sortType,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        Page<BoardResponseDTO> page = boardService.getBoardsByCategorySorted(categoryId, sortType, pageable);

        ResponseDTO<Page<BoardResponseDTO>> res = ResponseDTO.<Page<BoardResponseDTO>>builder()
                                                             .status(HttpStatus.OK.value())
                                                             .message("카테고리별 게시글 목록 조회 성공")
                                                             .data(page)
                                                             .build();

        return ResponseEntity.ok(res);
    }

    @Operation(summary = "내 게시글 목록 조회", description = "로그인한 사용자가 작성한 게시글 목록을 조회합니다.")
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

    @Operation(summary = "공지글 목록 조회", description = "공지로 등록된 게시글 목록을 조회합니다.")
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
    
    @Operation(summary = "게시글 검색", description = "제목, 내용 또는 작성자명으로 게시글을 검색합니다.")
    @GetMapping("/search")
    public ResponseEntity<ResponseDTO<Page<BoardResponseDTO>>> searchBoards(
            @RequestParam(name = "type") String type,
            @RequestParam(name = "keyword") String keyword,
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
    
    @Operation(summary = "최근 본 게시글 10개 조회", description = "로그인한 사용자의 최근 본 게시글을 최대 10개까지 최신순으로 조회합니다.")
    @GetMapping("/recent")
    public ResponseEntity<ResponseDTO<List<BoardResponseDTO>>> getRecentViewedBoards(
            @AuthenticationPrincipal String email
    ) {
        List<BoardResponseDTO> list = boardService.getRecentViewedBoards(email);

        ResponseDTO<List<BoardResponseDTO>> res = ResponseDTO.<List<BoardResponseDTO>>builder()
                                                             .status(HttpStatus.OK.value())
                                                             .message("최근 본 게시글 목록 조회 성공")
                                                             .data(list)
                                                             .build();

        return ResponseEntity.ok(res);
    }

}