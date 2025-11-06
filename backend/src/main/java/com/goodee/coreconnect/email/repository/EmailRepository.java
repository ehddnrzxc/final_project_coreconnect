package com.goodee.coreconnect.email.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.email.entity.Email;
import com.goodee.coreconnect.email.enums.EmailStatusEnum;

public interface EmailRepository extends JpaRepository<Email, Integer> {

	// 내가 보낸 이메일 전체 (페이징)
	Page<Email> findBySenderId(Integer userId, Pageable pageable);

	// 내가 보낸 이메일 중 특정 상태(Bounce 등)만 페이징
	Page<com.goodee.coreconnect.email.entity.Email> findBySenderIdAndEmailStatus(Integer userId, EmailStatusEnum bounce, Pageable pageable);

}
