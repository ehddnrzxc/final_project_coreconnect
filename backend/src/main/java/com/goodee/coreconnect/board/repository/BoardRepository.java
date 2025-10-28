package com.goodee.coreconnect.board.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.board.entity.Board;

public interface BoardRepository extends JpaRepository<Board, Integer> {

    // 카테고리별 게시글 목록
    List<Board> findByCategoryId(Integer categoryId);

    // 사용자별 작성 게시글 목록
    List<Board> findByUserId(Integer userId);

    // 공지글만 조회
    List<Board> findBynoticeYnTrue();
}
