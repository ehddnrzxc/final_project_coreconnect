package com.goodee.coreconnect.board.service;

import java.util.List;

import com.goodee.coreconnect.board.dto.request.BoardRequestDTO;
import com.goodee.coreconnect.board.dto.response.BoardResponseDTO;

public interface BoardService {

    // 게시글 등록
    BoardResponseDTO createBoard(BoardRequestDTO dto, Integer userId);

    // 게시글 수정
    BoardResponseDTO updateBoard(Integer boardId, BoardRequestDTO dto);

    // 게시글 삭제 (deletedYn = true)
    BoardResponseDTO softDeleteBoard(Integer boardId);

    // 게시글 상세 조회
    BoardResponseDTO getBoardById(Integer boardId);

    // 카테고리별 게시글 목록 조회
    List<BoardResponseDTO> getBoardsByCategory(Integer categoryId);

    // 사용자별 게시글 목록 조회
    List<BoardResponseDTO> getBoardsByUser(Integer userId);

    // 공지글 목록 조회
    List<BoardResponseDTO> getNoticeBoards();
}
