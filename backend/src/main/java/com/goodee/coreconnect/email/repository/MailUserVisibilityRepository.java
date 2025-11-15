package com.goodee.coreconnect.email.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.email.entity.MailUserVisibility;

public interface MailUserVisibilityRepository extends JpaRepository<MailUserVisibility, Integer> {
	 Optional<MailUserVisibility> findByMailIdAndUserId(Long mailId, Long userId);
}
