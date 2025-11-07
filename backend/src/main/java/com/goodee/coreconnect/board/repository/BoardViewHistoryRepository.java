package com.goodee.coreconnect.board.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.goodee.coreconnect.board.entity.Board;
import com.goodee.coreconnect.board.entity.BoardViewHistory;
import com.goodee.coreconnect.user.entity.User;

public interface BoardViewHistoryRepository extends JpaRepository<BoardViewHistory, Integer> {
  
    /** 특정 사용자(User)가 특정 게시글(Board)을 이미 조회했는지 여부 확인 */
    boolean existsByUserAndBoard(User user, Board board);
    
    // 기존 기록 가져와서 viewedAt 갱신할 수 있도록
    Optional<BoardViewHistory> findByUserAndBoard(User user, Board board);
    
    /** 최근 조회 기록 조회 (최신순 정렬) */
    @Query("""
        SELECT h 
        FROM BoardViewHistory h
        JOIN FETCH h.board b
        WHERE h.user.id = :userId
        ORDER BY h.viewedAt DESC
    """)
    List<BoardViewHistory> findRecentByUserId(@Param("userId") Integer userId);
}
