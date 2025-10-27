package com.goodee.coreconnect.chat.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.goodee.coreconnect.chat.entity.Notification;

import io.lettuce.core.dynamic.annotation.Param;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

	List<Notification> findByChatId(Integer id);

	List<Notification> findByUserId(Integer id);
	
	/**
     * 원본 문서가 삭제될 때 관련 알림을 수동으로 삭제하기 위한 쿼리
     */
	@Modifying
	@Query("UPDATE Document d SET d.docDeletedYn = true WHERE d.id = :documentId")
	void deleteByDocumentId(@Param("documentId") Integer documentId);
	
}
