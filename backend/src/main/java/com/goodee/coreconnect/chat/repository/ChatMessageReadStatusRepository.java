package com.goodee.coreconnect.chat.repository;

import java.util.List;
import java.util.Optional;

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
    
    @Query("SELECT r FROM ChatMessageReadStatus r "
    	     + "JOIN FETCH r.chat c "
    	     + "JOIN FETCH c.sender "
    	     + "WHERE r.user.id = :userId AND r.readYn = false")
    List<ChatMessageReadStatus> fetchUnreadWithSender(@Param("userId") Integer userId);
    
 // 내(userId)가 특정 채팅방(roomId)에서 읽지 않은 개수 집계
    @Query("SELECT COUNT(r) FROM ChatMessageReadStatus r WHERE r.user.id = :userId AND r.chat.chatRoom.id = :roomId AND r.readYn = false")
    int countByUserIdAndChatRoomIdAndReadYnFalse(@Param("userId") Integer userId, @Param("roomId") Integer roomId);

    // 내(userId) 지정 방(roomId)의 안읽은 메시지 중, 가장 최근 1건
    @Query(
        "SELECT r FROM ChatMessageReadStatus r " +
        "WHERE r.user.id = :userId AND r.chat.chatRoom.id = :roomId AND r.readYn = false " +
        "ORDER BY r.chat.sendAt DESC"
    )
    List<ChatMessageReadStatus> findLastUnreadStatusInRoomForUserList(@Param("userId") Integer userId, @Param("roomId") Integer roomId);

    // default 단건 getter (리스트에서 가장 첫번째가 최신!)
    default ChatMessageReadStatus findLastUnreadStatusInRoomForUser(Integer userId, Integer roomId) {
        List<ChatMessageReadStatus> result = findLastUnreadStatusInRoomForUserList(userId, roomId);
        return (result != null && !result.isEmpty()) ? result.get(0) : null;
    }
    
    
    // 내가 참여중인 모든 채팅방에서 방별 unread 메시지 개수 집계
    // 결과: roomId, unreadCount로 반환 + 방 ID 단위로 내가 안읽은 메시지 개수 그룹핑
    @Query("SELECT c.chat.chatRoom.id AS roomId, COUNT(c) AS unreadCount FROM ChatMessageReadStatus c WHERE c.user.id = :userId AND c.readYn = false GROUP BY c.chat.chatRoom.id")
    List<Object[]> countUnreadMessagesByUserId(@Param("userId") Integer userId);
    
    // 올바른 JPA 네이밍 방식 적용!
    Optional<ChatMessageReadStatus> findByChatIdAndUserId(Integer chatId, Integer userId);
    
    // 또는 직접 JPQL 사용하고 싶을 때
    @Query("SELECT c FROM ChatMessageReadStatus c WHERE c.chat.id = :chatId AND c.user.id = :userId")
    Optional<ChatMessageReadStatus> findReadStatusByChatIdAndUserId(@Param("chatId") Integer chatId, @Param("userId") Integer userId);
    
}
