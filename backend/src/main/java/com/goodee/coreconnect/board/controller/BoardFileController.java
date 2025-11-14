package com.goodee.coreconnect.board.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.board.dto.response.BoardFileResponseDTO;
import com.goodee.coreconnect.board.service.BoardFileService;
import com.goodee.coreconnect.common.dto.response.ResponseDTO;
import com.goodee.coreconnect.security.userdetails.CustomUserDetails;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Tag(name = "Board File API", description = "게시글 첨부파일 업로드/조회/삭제 API")
@RestController
@RequestMapping("/api/v1/board-file")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class BoardFileController {

    private final BoardFileService boardFileService;

    @Operation(summary = "파일 업로드", description = "게시글 ID를 기준으로 파일을 업로드합니다.")
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

    @Operation(summary = "단일 파일 조회", description = "파일 ID를 기준으로 단일 파일 정보를 조회합니다.")
    @GetMapping("/{fileId}")
    public ResponseEntity<ResponseDTO<BoardFileResponseDTO>> getFile(@PathVariable("fileId") Integer fileId) {
        BoardFileResponseDTO file = boardFileService.getFile(fileId);

        ResponseDTO<BoardFileResponseDTO> res = ResponseDTO.<BoardFileResponseDTO>builder()
                                                           .status(HttpStatus.OK.value())
                                                           .message("파일 조회 성공")
                                                           .data(file)
                                                           .build();
        return ResponseEntity.ok(res);
    }

    @Operation(summary = "게시글별 파일 목록 조회", description = "특정 게시글에 첨부된 파일 목록을 조회합니다.")
    @GetMapping("/board/{boardId}")
    public ResponseEntity<ResponseDTO<List<BoardFileResponseDTO>>> getFilesByBoard(@PathVariable("boardId") Integer boardId) {
        List<BoardFileResponseDTO> files = boardFileService.getFilesByBoard(boardId);

        ResponseDTO<List<BoardFileResponseDTO>> res = ResponseDTO.<List<BoardFileResponseDTO>>builder()
                                                                 .status(HttpStatus.OK.value())
                                                                 .message("게시글 첨부파일 목록 조회 성공")
                                                                 .data(files)
                                                                 .build();
        return ResponseEntity.ok(res);
    }

    @Operation(summary = "파일 삭제", description = "파일을 Soft Delete 방식으로 삭제합니다.")
    @DeleteMapping("/{fileId}")
    public ResponseEntity<ResponseDTO<Void>> deleteFile(
            @PathVariable("fileId") Integer fileId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        boardFileService.deleteFile(fileId);

        ResponseDTO<Void> res = ResponseDTO.<Void>builder()
                                           .status(HttpStatus.NO_CONTENT.value())
                                           .message("파일이 삭제되었습니다.")
                                           .data(null)
                                           .build();
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(res);
    }
    
    @Operation(summary = "여러 파일 삭제", description = "수정 화면에서 1개 이상의 파일을 한 번에 삭제합니다.")
    @DeleteMapping("/bulk")
    public ResponseEntity<ResponseDTO<Void>> deleteFilesBulk(
            @RequestBody Map<String, List<Integer>> request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        List<Integer> fileIds = request.get("fileIds");
        boardFileService.deleteFiles(fileIds);

        ResponseDTO<Void> res = ResponseDTO.<Void>builder()
                                           .status(HttpStatus.NO_CONTENT.value())
                                           .message("여러 파일 삭제 완료")
                                           .build();

        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(res);
    }
    
    @Operation(summary = "전체 파일 다운로드", description = "게시글의 모든 첨부파일을 ZIP으로 다운로드합니다.")
    @GetMapping("/board/{boardId}/download-all")      
    public void downloadAllFiles(                     
            @PathVariable("boardId") Integer boardId,
            HttpServletResponse response
    ) throws Exception {
        boardFileService.downloadAllFiles(boardId, response);  
    }
    
    @Operation(summary = "단일 파일 다운로드", description = "특정 첨부파일을 직접 다운로드합니다.")
    @GetMapping("/download/{fileId}")
    public void downloadSingleFile(
            @PathVariable Integer fileId,
            HttpServletResponse response
    ) throws Exception {
        boardFileService.downloadSingleFile(fileId, response);
    }
}
