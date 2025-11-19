package com.goodee.coreconnect.email.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.goodee.coreconnect.email.entity.MailUserVisibility;

public interface MailUserVisibilityRepository extends JpaRepository<MailUserVisibility, Integer> {
	 Optional<MailUserVisibility> findByMailIdAndUserId(Long mailId, Long userId);
	 
	 @Query(
        value = "SELECT m.mail_id FROM mail_user_visibility m " +
                "WHERE m.user_id = :userId AND (m.deleted = 1 OR m.deleted = true) " +
                "ORDER BY m.deleted_at DESC",
        nativeQuery = true
    )
    List<Long> findDeletedMailIdsByUserId(@Param("userId") Long userId);
	 
	 @Modifying
	 @Query("DELETE FROM MailUserVisibility m WHERE m.userId = :userId AND m.deleted = true")
	 void deleteAllByUserIdAndDeletedIsTrue(@Param("userId") Long userId);
	 
	 @Modifying
	 @Query("DELETE FROM MailUserVisibility m WHERE m.mailId IN :mailIds AND m.userId = :userId")
	 void deleteAllByMailIdInAndUserId(@Param("mailIds") List<Long> mailIds, @Param("userId") Long userId);
}
