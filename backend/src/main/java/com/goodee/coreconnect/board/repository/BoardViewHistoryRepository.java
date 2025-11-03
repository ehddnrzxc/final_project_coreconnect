package com.goodee.coreconnect.board.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.goodee.coreconnect.board.entity.Board;
import com.goodee.coreconnect.board.entity.BoardViewHistory;
import com.goodee.coreconnect.user.entity.User;

public interface BoardViewHistoryRepository extends JpaRepository<BoardViewHistory, Integer> {
    boolean existsByUserAndBoard(User user, Board board);
}
