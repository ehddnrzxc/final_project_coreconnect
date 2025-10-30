package com.goodee.coreconnect.chat.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.goodee.coreconnect.chat.entity.ChatRoomUser;

public interface ChatRoomUserRepository extends JpaRepository<ChatRoomUser, Integer> {
	List<ChatRoomUser> findByChatRoomId(Integer chatRoomId);
	
	@Query("SELECT cru FROM ChatRoomUser cru JOIN FETCH cru.user WHERE cru.chatRoom.id = :roomId")
	List<ChatRoomUser> findByChatRoomIdWithUser(@Param("roomId") Integer roomId);
	
	// 내가 참여한 모든 채팅방
	@Query("SELECT cru FROM ChatRoomUser cru JOIN FETCH cru.chatRoom WHERE cru.user.id = :userId")
	List<ChatRoomUser> findByUserId(@Param("userId") Integer userId);
}
