package com.goodee.coreconnect.board.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.goodee.coreconnect.board.entity.BoardCategory;

@Repository
public interface BoardCategoryRepository extends JpaRepository<BoardCategory, Integer> {

    // 전체 카테고리 목록
    List<BoardCategory> getCategories();

    // 카테고리명 중복 여부 확인
    boolean isCategoryNameExists(String name);
}
