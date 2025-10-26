package com.goodee.coreconnect.chat.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.chat.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
	
}
