package com.goodee.coreconnect.board.service;

import java.util.List;

import com.goodee.coreconnect.board.dto.request.BoardCategoryRequestDTO;
import com.goodee.coreconnect.board.dto.response.BoardCategoryResponseDTO;

public interface BoardCategoryService {

    /** 카테고리 등록 */
    BoardCategoryResponseDTO createCategory(BoardCategoryRequestDTO dto);

    /** 카테고리 수정 */
    BoardCategoryResponseDTO updateCategory(Integer categoryId, BoardCategoryRequestDTO dto);

    /** 카테고리 삭제 (Soft Delete) */
    void deleteCategory(Integer categoryId);

    /** 전체 카테고리 목록 (삭제 제외) */
    List<BoardCategoryResponseDTO> getAllCategories();

    /** 카테고리명 중복 여부 확인 */
    boolean isCategoryNameExists(String name);
}
