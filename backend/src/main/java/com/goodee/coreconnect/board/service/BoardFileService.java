package com.goodee.coreconnect.board.service;

import java.util.List;

import com.goodee.coreconnect.board.dto.request.BoardFileRequestDTO;
import com.goodee.coreconnect.board.dto.response.BoardFileResponseDTO;

public interface BoardFileService {

    // 파일 등록
    BoardFileResponseDTO createFile(BoardFileRequestDTO dto);

    // 파일 삭제 (S3 삭제 + DB에서 deletedYn = true로 업데이트)
    void softDeleteFile(Integer fileId);

    // 게시글별 파일 목록
    List<BoardFileResponseDTO> getFilesByBoard(Integer boardId);

    // S3 Key로 파일 조회
    BoardFileResponseDTO getFileByS3Key(String s3ObjectKey);
}
