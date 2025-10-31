package com.goodee.coreconnect.chat.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.goodee.coreconnect.chat.entity.ChatMessageReadStatus;

import org.springframework.data.repository.query.Param;

public interface ChatMessageReadStatusRepository extends JpaRepository<ChatMessageReadStatus, Integer>{
	 // 2. 채팅 메시지별 미읽은 사용자 목록 조회
    @Query("SELECT r FROM ChatMessageReadStatus r WHERE r.chat.id = :chatId AND r.readYn = false")
    List<ChatMessageReadStatus> findUnreadByChatId(@Param("chatId") Integer chatId);

    // 2. 채팅방별로 각 메시지에 대해 미읽은 수 조회 가능
	
	@Query("SELECT r.chat.id, COUNT(r) FROM ChatMessageReadStatus r WHERE r.chat.chatRoom.id = :roomId AND r.readYn = false GROUP BY r.chat.id")
	List<Object[]> countUnreadByRoomId(@Param("roomId") Integer roomId);
    int countUnreadByChatId(Integer chatId);
    
    
}
