package com.goodee.coreconnect.chat.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.goodee.coreconnect.common.entity.Notification;
import com.goodee.coreconnect.common.notification.enums.NotificationType;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

	List<Notification> findByChatId(Integer id);

	List<Notification> findByUserId(Integer id);
	
	@Modifying
	@Query("UPDATE Document d SET d.docDeletedYn = true WHERE d.id = :documentId")
	void deleteByDocumentId(@Param("documentId") Integer documentId);
	
    List<Notification> findByDocumentId(Integer documentId);

   // @Query("SELECT n FROM Notification n " +
   // 	       "WHERE n.user.id = :userId " +
   // 	       "AND n.notificationReadYn = false " +
   // 	       "AND n.notificationType IN (:types)")
//	List<Notification> findUnreadByUserIdAndTypes(@Param("userId") Integer userId,
	                                           //   @Param("types") List<NotificationType> types);

	//List<Notification> findByUserIdAndNotificationReadYnIsFalse(Integer userId);
	
    @Query("SELECT n FROM Notification n " +
    	       "JOIN FETCH n.user " +
    	       "WHERE n.user.id = :userId " +
    	       "AND n.notificationReadYn = false " +
    	       "AND n.notificationType IN (:types)")
    	List<Notification> findUnreadByUserIdAndTypes(@Param("userId") Integer userId,
    	                                              @Param("types") List<NotificationType> types);
	
}
