package com.goodee.coreconnect.chat.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.goodee.coreconnect.chat.entity.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

	List<Notification> findByChatId(Integer id);
	
}
