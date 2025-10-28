package com.goodee.coreconnect.board.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.board.dto.response.BoardFileResponseDTO;

public interface BoardFileService {

    /** 파일 업로드 및 등록 */
    List<BoardFileResponseDTO> uploadFiles(Integer boardId, List<MultipartFile> files);

    /** 파일 단건 다운로드 */
    BoardFileResponseDTO getFile(Integer fileId);

    /** 파일 목록 (게시글 기준) */
    List<BoardFileResponseDTO> getFilesByBoard(Integer boardId);

    /** 파일 삭제 (Soft Delete) */
    void deleteFile(Integer fileId);
}
