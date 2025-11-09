package com.goodee.coreconnect.email.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.email.entity.Email;
import com.goodee.coreconnect.email.entity.EmailRecipient;

public interface EmailRecipientRepository extends JpaRepository<EmailRecipient, Integer> {

	/**
	 * 목적: 특정 이메일(userEmail)이 TO/CC/BCC로 수신한 이메일 목록을 페이징으로 조회
	 * - userEmail: 수신자 이메일 주소(예: shark@gmail.com)
	 * - emailRecipientType: 수신자 타입 리스트("TO", "CC", "BCC" 등)
	 * - pageable: 페이징 정보 
	 * => 실제 쿼리 예시:
	 *    SELECT * FROM email_recipient WHERE email_recipient_address = ? AND email_recipient_type IN (?, ..., ?)
	 */
	Page<EmailRecipient> findByEmailRecipientAddressAndEmailRecipientTypeIn(
	    String emailRecipientAddress, List<String> emailRecipientType, Pageable pageable
	);
	
	/**
     * 목적: 특정 이메일의 모든 수신자(TO/CC/BCC 등)를 리스트로 반환  
     * - email: 메일 엔티티(Email)의 FK  
     * => 실제 쿼리 예시:  
     *    SELECT * FROM email_recipient WHERE email_id = ?  
     */
    List<EmailRecipient> findByEmail(com.goodee.coreconnect.email.entity.Email email);

    // 수신자 이메일 기준, 읽음여부로 개수 카운트
    int countByEmailRecipientAddressAndEmailReadYn(String emailRecipientAddress, Boolean emailReadYn);

    // 안읽은 메일만 페이징 (filter=unread)
    Page<EmailRecipient> findByEmailRecipientAddressAndEmailRecipientTypeInAndEmailReadYn(
        String emailRecipientAddress, List<String> emailRecipientType, Boolean emailReadYn, Pageable pageable
    );

    // 오늘 온 메일만 페이징 (filter=today)  
    // ※ emailReceivedTime이 없다면 emailSentTime 등으로 이름 변경!  
    Page<EmailRecipient> findByEmailRecipientAddressAndEmailRecipientTypeInAndEmail_EmailSentTimeBetween(
    	    String emailRecipientAddress,
    	    List<String> emailRecipientType,
    	    LocalDateTime start,
    	    LocalDateTime end,
    	    Pageable pageable
    	);
    
    
}
