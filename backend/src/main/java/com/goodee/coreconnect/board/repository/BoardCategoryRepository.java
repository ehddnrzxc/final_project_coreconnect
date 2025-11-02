package com.goodee.coreconnect.board.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.board.entity.BoardCategory;

public interface BoardCategoryRepository extends JpaRepository<BoardCategory, Integer> {

    /**
     * 전체 카테고리 목록 조회 (삭제 제외)
     */
    List<BoardCategory> findByDeletedYnFalseOrderByOrderNoAsc();

    /**
     * 카테고리명 중복 여부 확인 (삭제 제외)
     */
    boolean existsByNameAndDeletedYnFalse(String name);
    
    /**
     * 카테고리 순서번호 중복 확인 
     */
    boolean existsByOrderNoAndDeletedYnFalse(Integer orderNo);

    /**
     * 단일 카테고리 조회 (삭제 제외)
     */
    Optional<BoardCategory> findByIdAndDeletedYnFalse(Integer categoryId);
}
