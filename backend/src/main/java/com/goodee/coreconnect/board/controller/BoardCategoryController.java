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

import com.goodee.coreconnect.board.dto.request.BoardCategoryRequestDTO;
import com.goodee.coreconnect.board.dto.response.BoardCategoryResponseDTO;
import com.goodee.coreconnect.board.service.BoardCategoryService;
import com.goodee.coreconnect.common.dto.response.ResponseDTO;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "Board Category API", description = "게시판 카테고리 관리 (관리자 전용)")
@RestController
@RequestMapping("/api/v1/board-category")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class BoardCategoryController {

    private final BoardCategoryService boardCategoryService;

    @Operation(summary = "카테고리 등록", description = "새 게시판 카테고리를 등록합니다. (관리자 전용)")
    @PostMapping
    public ResponseEntity<ResponseDTO<BoardCategoryResponseDTO>> createCategory(
            @RequestBody BoardCategoryRequestDTO dto,
            @AuthenticationPrincipal String email
    ) {
        BoardCategoryResponseDTO created = boardCategoryService.createCategory(dto, email);

        ResponseDTO<BoardCategoryResponseDTO> res = ResponseDTO.<BoardCategoryResponseDTO>builder()
                                                               .status(HttpStatus.CREATED.value())
                                                               .message("카테고리가 등록되었습니다.")
                                                               .data(created)
                                                               .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @Operation(summary = "카테고리 수정", description = "기존 카테고리 정보를 수정합니다. (관리자 전용)")
    @PutMapping("/{categoryId}")
    public ResponseEntity<ResponseDTO<BoardCategoryResponseDTO>> updateCategory(
            @PathVariable("categoryId") Integer categoryId,
            @RequestBody BoardCategoryRequestDTO dto,
            @AuthenticationPrincipal String email
    ) {
        BoardCategoryResponseDTO updated = boardCategoryService.updateCategory(categoryId, dto, email);

        ResponseDTO<BoardCategoryResponseDTO> res = ResponseDTO.<BoardCategoryResponseDTO>builder()
                                                               .status(HttpStatus.OK.value())
                                                               .message("카테고리가 수정되었습니다.")
                                                               .data(updated)
                                                               .build();

        return ResponseEntity.ok(res);
    }

    @Operation(summary = "카테고리 삭제", description = "카테고리를 Soft Delete 방식으로 삭제합니다. (관리자 전용)")
    @DeleteMapping("/{categoryId}")
    public ResponseEntity<ResponseDTO<Void>> deleteCategory(
            @PathVariable("categoryId") Integer categoryId,
            @AuthenticationPrincipal String email
    ) {
        boardCategoryService.deleteCategory(categoryId, email);

        ResponseDTO<Void> res = ResponseDTO.<Void>builder()
                                           .status(HttpStatus.NO_CONTENT.value())
                                           .message("카테고리가 삭제되었습니다.")
                                           .build();

        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(res);
    }

    @Operation(summary = "전체 카테고리 목록 조회", description = "모든 게시판 카테고리를 조회합니다. (관리자 전용)")
    @GetMapping
    public ResponseEntity<ResponseDTO<List<BoardCategoryResponseDTO>>> getAllCategories(
            @AuthenticationPrincipal String email
    ) {
        List<BoardCategoryResponseDTO> list = boardCategoryService.getAllCategories();

        ResponseDTO<List<BoardCategoryResponseDTO>> res = ResponseDTO.<List<BoardCategoryResponseDTO>>builder()
                                                                     .status(HttpStatus.OK.value())
                                                                     .message("카테고리 목록 조회 성공 (관리자 전용)")
                                                                     .data(list)
                                                                     .build();

        return ResponseEntity.ok(res);
    }
}
