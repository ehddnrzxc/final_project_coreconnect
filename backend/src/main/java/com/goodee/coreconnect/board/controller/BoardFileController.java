package com.goodee.coreconnect.board.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.board.dto.response.BoardFileResponseDTO;
import com.goodee.coreconnect.board.service.BoardFileService;
import com.goodee.coreconnect.common.dto.response.ResponseDTO;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/board-file")
@RequiredArgsConstructor
public class BoardFileController {

    private final BoardFileService boardFileService;

    // 파일 업로드
    @PostMapping("/{boardId}/upload")
    public ResponseEntity<ResponseDTO<List<BoardFileResponseDTO>>> uploadFiles(
            @PathVariable("boardId") Integer boardId,
            @RequestPart("files") List<MultipartFile> files
    ) {
        List<BoardFileResponseDTO> uploadedFiles = boardFileService.uploadFiles(boardId, files);

        ResponseDTO<List<BoardFileResponseDTO>> res = ResponseDTO.<List<BoardFileResponseDTO>>builder()
                                                                 .status(HttpStatus.CREATED.value())
                                                                 .message("파일 업로드 성공")
                                                                 .data(uploadedFiles)
                                                                 .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    // 단일 파일 조회 (다운로드 or 미리보기)
    @GetMapping("/{fileId}")
    public ResponseEntity<ResponseDTO<BoardFileResponseDTO>> getFile(
            @PathVariable("fileId") Integer fileId
    ) {
        BoardFileResponseDTO file = boardFileService.getFile(fileId);

        ResponseDTO<BoardFileResponseDTO> res = ResponseDTO.<BoardFileResponseDTO>builder()
                .status(HttpStatus.OK.value())
                .message("파일 조회 성공")
                .data(file)
                .build();

        return ResponseEntity.ok(res);
    }

    // 게시글별 파일 목록 조회
    @GetMapping("/board/{boardId}")
    public ResponseEntity<ResponseDTO<List<BoardFileResponseDTO>>> getFilesByBoard(
            @PathVariable("boardId") Integer boardId
    ) {
        List<BoardFileResponseDTO> files = boardFileService.getFilesByBoard(boardId);

        ResponseDTO<List<BoardFileResponseDTO>> res = ResponseDTO.<List<BoardFileResponseDTO>>builder()
                .status(HttpStatus.OK.value())
                .message("게시글 첨부파일 목록 조회 성공")
                .data(files)
                .build();

        return ResponseEntity.ok(res);
    }

    // 파일 삭제 (Soft Delete)
    @DeleteMapping("/{fileId}")
    public ResponseEntity<ResponseDTO<Void>> deleteFile(
            @PathVariable("fileId") Integer fileId,
            @AuthenticationPrincipal String email
    ) {
        boardFileService.deleteFile(fileId);

        ResponseDTO<Void> res = ResponseDTO.<Void>builder()
                .status(HttpStatus.NO_CONTENT.value())
                .message("파일이 삭제되었습니다.")
                .data(null)
                .build();

        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(res);
    }
}
