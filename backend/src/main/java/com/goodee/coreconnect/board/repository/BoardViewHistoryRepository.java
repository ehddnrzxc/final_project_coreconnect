package com.goodee.coreconnect.board.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.goodee.coreconnect.board.entity.Board;
import com.goodee.coreconnect.board.entity.BoardViewHistory;
import com.goodee.coreconnect.user.entity.User;

public interface BoardViewHistoryRepository extends JpaRepository<BoardViewHistory, Integer> {
  
    /** 특정 사용자(User)가 특정 게시글(Board)을 이미 조회했는지 여부 확인 */
    boolean existsByUserAndBoard(User user, Board board);
}
