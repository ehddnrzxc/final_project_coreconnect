package com.goodee.coreconnect.board.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.goodee.coreconnect.board.dto.request.BoardRequestDTO;
import com.goodee.coreconnect.board.dto.response.BoardResponseDTO;

public interface BoardService {

    /** 게시글 등록 */
    BoardResponseDTO createBoard(BoardRequestDTO dto, String email);

    /** 게시글 수정 */
    BoardResponseDTO updateBoard(Integer boardId, BoardRequestDTO dto);

    /** 게시글 삭제 (Soft Delete) */
    void softDeleteBoard(Integer boardId);

    /** 게시글 상세 조회 */
    BoardResponseDTO getBoardById(Integer boardId);

    /** 전체 게시글 목록 */
    Page<BoardResponseDTO> getAllBoards(Pageable pageable);

    /** 카테고리별 게시글 목록 */
    Page<BoardResponseDTO> getBoardsByCategory(Integer categoryId, Pageable pageable);

    /** ✅ 사용자별 게시글 목록 (이메일 기반) */
    Page<BoardResponseDTO> getBoardsByUser(String email, Pageable pageable);

    /** 공지글 목록 조회 */
    List<BoardResponseDTO> getNoticeBoards();

    /** 검색 (제목, 내용, 작성자명 중 선택형) */
    Page<BoardResponseDTO> searchBoards(String type, String keyword, Pageable pageable);
}
