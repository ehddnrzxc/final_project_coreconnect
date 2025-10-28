package com.goodee.coreconnect.board.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.board.dto.request.BoardCategoryRequestDTO;
import com.goodee.coreconnect.board.dto.response.BoardCategoryResponseDTO;
import com.goodee.coreconnect.board.entity.BoardCategory;
import com.goodee.coreconnect.board.repository.BoardCategoryRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class BoardCategoryServiceImpl implements BoardCategoryService {

    private final BoardCategoryRepository categoryRepository;

    /** 카테고리 등록 */
    @Override
    public BoardCategoryResponseDTO createCategory(BoardCategoryRequestDTO dto) {
        if (isCategoryNameExists(dto.getName())) {
            throw new IllegalArgumentException("이미 존재하는 카테고리명입니다: " + dto.getName());
        }

        BoardCategory category = BoardCategory.createCategory(
                dto.getName(),
                dto.getOrderNo()
        );

        BoardCategory saved = categoryRepository.save(category);
        return BoardCategoryResponseDTO.toDTO(saved);
    }

    /** 카테고리 수정 */
    @Override
    public BoardCategoryResponseDTO updateCategory(Integer categoryId, BoardCategoryRequestDTO dto) {
        BoardCategory category = categoryRepository.findByIdAndDeletedYnFalse(categoryId)
                .orElseThrow(() -> new EntityNotFoundException("카테고리를 찾을 수 없습니다."));

        category.updateCategory(dto.getName(), dto.getOrderNo());
        return BoardCategoryResponseDTO.toDTO(category);
    }

    /** 카테고리 삭제 (Soft Delete) */
    @Override
    public void deleteCategory(Integer categoryId) {
        BoardCategory category = categoryRepository.findByIdAndDeletedYnFalse(categoryId)
                .orElseThrow(() -> new EntityNotFoundException("카테고리를 찾을 수 없습니다."));

        category.delete();
    }

    /** 전체 카테고리 목록 (삭제 제외, 순서 정렬) */
    @Override
    @Transactional(readOnly = true)
    public List<BoardCategoryResponseDTO> getAllCategories() {
        List<BoardCategory> categories = categoryRepository.findByDeletedYnFalseOrderByOrderNoAsc();
        List<BoardCategoryResponseDTO> dtoList = new ArrayList<>();

        for (BoardCategory category : categories) {
            dtoList.add(BoardCategoryResponseDTO.toDTO(category));
        }

        return dtoList;
    }

    /** 카테고리명 중복 여부 확인 */
    @Override
    @Transactional(readOnly = true)
    public boolean isCategoryNameExists(String name) {
        return categoryRepository.existsByNameAndDeletedYnFalse(name);
    }
}
