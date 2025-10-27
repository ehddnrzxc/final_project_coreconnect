package com.goodee.coreconnect.board.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.goodee.coreconnect.board.entity.Board;

@Repository
public interface BoardRepository extends JpaRepository<Board, Integer> {

    // 카테고리별 게시글 목록
    List<Board> getBoardsByCategoryId(Integer categoryId);

    // 사용자별 작성 게시글 목록
    List<Board> getBoardsByUserId(Integer userId);

    // 공지글만 조회
    List<Board> getNoticeBoards();
}
