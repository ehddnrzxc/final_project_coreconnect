package com.goodee.coreconnect.email.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.email.entity.Email;
import com.goodee.coreconnect.email.enums.EmailStatusEnum;

public interface EmailRepository extends JpaRepository<Email, Integer> {

	 // 이메일(문자열)로 조회
	 Page<Email> findBySenderEmail(String email, Pageable pageable);

	// 내가 보낸 이메일 중 특정 상태(Bounce 등)만 페이징
	Page<com.goodee.coreconnect.email.entity.Email> findBySenderIdAndEmailStatus(Integer userId, EmailStatusEnum bounce, Pageable pageable);

	// [추가] 내가 보낸 이메일 중 특정 상태(DRAFT 등) + senderEmail 기준 페이징 조회
    Page<Email> findBySenderEmailAndEmailStatus(String senderEmail, EmailStatusEnum emailStatus, Pageable pageable);

    // [추가] 임시보관함 카운트용
    long countBySenderEmailAndEmailStatus(String senderEmail, EmailStatusEnum emailStatus);

    Optional<Email> findByEmailIdAndSenderEmailAndEmailStatus(
    	    Integer emailId, String senderEmail, EmailStatusEnum emailStatus);

    // 예약상태 & 예약시각이 도달(이전/같음)한 이메일 전체 조회
    List<Email> findAllByEmailStatusAndReservedAtLessThanEqual(EmailStatusEnum emailStatus, LocalDateTime reservedAt);

}
