package com.goodee.coreconnect.chat.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.goodee.coreconnect.chat.entity.MessageFile;

@Repository
public interface MessageFileRepository extends JpaRepository<MessageFile, Integer> {
	
}
