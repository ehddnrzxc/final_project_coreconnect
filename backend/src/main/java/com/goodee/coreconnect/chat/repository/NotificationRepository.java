package com.goodee.coreconnect.chat.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.goodee.coreconnect.chat.entity.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

	List<Notification> findByChatId(Integer id);

	List<Notification> findByUserId(Integer id);
	
	@Modifying
	@Query("UPDATE Document d SET d.docDeletedYn = true WHERE d.id = :documentId")
	void deleteByDocumentId(@Param("documentId") Integer documentId);
  List<Notification> findByDocumentId(Integer documentId);
	
}
