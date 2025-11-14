package com.goodee.coreconnect.board.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.board.dto.response.BoardFileResponseDTO;

import jakarta.servlet.http.HttpServletResponse;

public interface BoardFileService {

    /** 다중 파일 업로드 */
    List<BoardFileResponseDTO> uploadFiles(Integer boardId, List<MultipartFile> files);

    /** 단일 파일 조회 (미리보기/다운로드) */
    BoardFileResponseDTO getFile(Integer fileId);

    /** 파일 목록 조회 (게시글 기준) */
    List<BoardFileResponseDTO> getFilesByBoard(Integer boardId);

    /** 파일 삭제 (Soft Delete) */
    void deleteFile(Integer fileId);
    
    /** 여러 파일 삭제 (1개 이상) */
    void deleteFiles(List<Integer> fileIds);
    
    /** ZIP 전체 다운로드 */
    void downloadAllFiles(Integer boardId, HttpServletResponse response) throws Exception;
    
    /** Presigned URL 내부 접근용 */
    String getPresignedUrlInternal(String key);
    
    /** 단일 파일 다운로드 */
    void downloadSingleFile(Integer fileId, HttpServletResponse response) throws Exception;
}
