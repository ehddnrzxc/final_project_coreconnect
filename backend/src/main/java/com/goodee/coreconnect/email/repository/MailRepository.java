package com.goodee.coreconnect.email.repository;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.goodee.coreconnect.email.entity.Email;
import com.goodee.coreconnect.email.enums.EmailStatusEnum;

import org.springframework.data.repository.query.Param;

/**
 * JPA 기반 Mail repository.
 *
 * - 기존 JdbcTemplate 기반 MailJdbcRepository를 대체합니다.
 * - sender_id 컬럼이 mail 테이블에 존재한다고 가정하고 nativeQuery로 sender_id만 읽어옵니다.
 *   (엔티티 매핑 상태에 따라 JPQL 버전으로 변경 가능)
 */
public interface MailRepository extends JpaRepository<Email, Integer> {

    /**
     * mail 테이블에서 sender_id만 읽어옵니다.
     * - nativeQuery를 사용하여 기존 JdbcTemplate 쿼리와 동일한 동작을 보장합니다.
     * - mail 테이블 또는 컬럼명이 다르면 쿼리를 수정하세요.
     *
     * 반환값: sender_id (없으면 null)
     */
    @Query(value = "SELECT sender_id FROM email WHERE email_id = :mailId", nativeQuery = true)
    Long findSenderIdByMailId(@Param("mailId") Long mailId);
    

}
