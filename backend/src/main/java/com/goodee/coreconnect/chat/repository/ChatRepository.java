package com.goodee.coreconnect.chat.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.chat.entity.Chat;

public interface ChatRepository extends JpaRepository<Chat, Integer> {

	List<Chat> findByChatRoomId(Integer id);

}
