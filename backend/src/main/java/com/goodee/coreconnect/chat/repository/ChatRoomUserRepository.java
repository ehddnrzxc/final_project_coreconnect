package com.goodee.coreconnect.chat.repository;

import java.util.List;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.goodee.coreconnect.chat.entity.ChatRoomUser;


public interface ChatRoomUserRepository extends JpaRepository<ChatRoomUser, Integer> {
	List<ChatRoomUser> findByChatRoomId(Integer chatRoomId);
	
	@Query("SELECT cru FROM ChatRoomUser cru JOIN FETCH cru.user LEFT JOIN FETCH cru.user.department WHERE cru.chatRoom.id = :roomId")
	List<ChatRoomUser> findByChatRoomIdWithUser(@Param("roomId") Integer roomId);
	
	// 내가 참여한 모든 채팅방
	@Query("SELECT cru FROM ChatRoomUser cru JOIN FETCH cru.chatRoom WHERE cru.user.id = :userId")
	List<ChatRoomUser> findByUserId(@Param("userId") Integer userId);
	
	// 특정 채팅방의 특정 사용자 조회
	@Query("SELECT cru FROM ChatRoomUser cru WHERE cru.chatRoom.id = :roomId AND cru.user.id = :userId")
	Optional<ChatRoomUser> findByChatRoomIdAndUserId(@Param("roomId") Integer roomId, @Param("userId") Integer userId);
}
