package com.goodee.coreconnect.board.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.goodee.coreconnect.board.entity.BoardCategory;

public interface BoardCategoryRepository extends JpaRepository<BoardCategory, Integer> {

    // 전체 카테고리 목록
    List<BoardCategory> findAllByOrderByOrderNoAsc();

    // 카테고리명 중복 여부 확인
    boolean existsByName(String name);
}
