package com.goodee.coreconnect.board.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.board.dto.response.BoardFileResponseDTO;

public interface BoardFileService {

    /** 다중 파일 업로드 */
    List<BoardFileResponseDTO> uploadFiles(Integer boardId, List<MultipartFile> files);

    /** 단일 파일 조회 (미리보기/다운로드) */
    BoardFileResponseDTO getFile(Integer fileId);

    /** 파일 목록 조회 (게시글 기준) */
    List<BoardFileResponseDTO> getFilesByBoard(Integer boardId);

    /** 파일 삭제 (Soft Delete) */
    void deleteFile(Integer fileId);
}
