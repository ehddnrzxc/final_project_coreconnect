package com.goodee.coreconnect.board.service;

import java.util.List;

import com.goodee.coreconnect.board.dto.request.BoardCategoryRequestDTO;
import com.goodee.coreconnect.board.dto.response.BoardCategoryResponseDTO;

public interface BoardCategoryService {

    /** 카테고리 등록 (관리자 전용) */
    BoardCategoryResponseDTO createCategory(BoardCategoryRequestDTO dto, String email);

    /** 카테고리 수정 (관리자 전용) */
    BoardCategoryResponseDTO updateCategory(Integer categoryId, BoardCategoryRequestDTO dto, String email);

    /** 카테고리 삭제 (관리자 전용, Soft Delete) */
    void deleteCategory(Integer categoryId, String email);

    /** 전체 카테고리 목록 (삭제 제외) */
    List<BoardCategoryResponseDTO> getAllCategories();

    /** 카테고리명 중복 여부 확인 */
    boolean isCategoryNameExists(String name);
}
