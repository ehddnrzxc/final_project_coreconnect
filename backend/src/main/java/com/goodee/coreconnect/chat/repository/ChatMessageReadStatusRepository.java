package com.goodee.coreconnect.chat.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.goodee.coreconnect.chat.entity.ChatMessageReadStatus;

import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface ChatMessageReadStatusRepository extends JpaRepository<ChatMessageReadStatus, Integer>{
	// 1. 채팅 메시지별 미읽은 사용자 목록 조회
    @Query("SELECT r FROM ChatMessageReadStatus r WHERE r.chat.id = :chatId AND r.readYn = false")
    List<ChatMessageReadStatus> findUnreadByChatId(@Param("chatId") Integer chatId);

    // 2. 채팅방별로 각 메시지에 대해 미읽은 수 조회 가능
	@Query("SELECT r.chat.id, COUNT(r) FROM ChatMessageReadStatus r WHERE r.chat.chatRoom.id = :roomId AND r.readYn = false GROUP BY r.chat.id")
	List<Object[]> countUnreadByRoomId(@Param("roomId") Integer roomId);
    int countUnreadByChatId(Integer chatId);

    // 3. 사용자별 미읽은 메시지 조회 
    @Query("SELECT r FROM ChatMessageReadStatus r WHERE r.user.id = :userId AND r.readYn = false")
    List<ChatMessageReadStatus> findByUserIdAndReadYnFalse(@Param("userId") Integer userId);
    
    
    // 4. 채팅방별 내가 안읽은 메시지 개수
    @Query("SELECT r.chat.chatRoom.id, COUNT(r) FROM ChatMessageReadStatus r WHERE r.user.id = :userId AND r.readYn = false GROUP BY r.chat.chatRoom.id")
    List<Object[]> countUnreadByRoomIdForUser(@Param("userId") Integer userId);
    
    // 5. 해당 채팅방의 내가 안읽은 메시지 목록
    @Query("SELECT r FROM ChatMessageReadStatus r WHERE r.user.id = :userId AND r.chat.chatRoom.id = :roomId AND r.readYn = false")
    List<ChatMessageReadStatus> findUnreadMessagesByRoomIdAndUserId(@Param("roomId") Integer roomId, @Param("userId") Integer userId);
    
    // 6. 내가 특정 채팅방에서 안읽은 메시지들을 모두 읽음 처리 (readYn=true, readAt=now)
    @Modifying
    @Transactional
    @Query("UPDATE ChatMessageReadStatus r SET r.readYn = true, r.readAt = :now " +
           "WHERE r.chat.chatRoom.id = :roomId AND r.user.id = :userId AND r.readYn = false")
    int markMessagesAsReadInRoomForUser(@Param("roomId") Integer roomId, @Param("userId") Integer userId, @Param("now") java.time.LocalDateTime now);
    
    
}
