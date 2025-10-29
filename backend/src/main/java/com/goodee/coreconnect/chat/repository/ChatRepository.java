package com.goodee.coreconnect.chat.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.goodee.coreconnect.chat.entity.Chat;

import org.springframework.data.repository.query.Param;

public interface ChatRepository extends JpaRepository<Chat, Integer> {

	List<Chat> findByChatRoomId(Integer id);
	
    @Query("SELECT c FROM Chat c WHERE c.chatRoom.id IN :roomIds")
    List<Chat> findByChatRoomIds(@Param("roomIds") List<Integer> roomIds);

}
