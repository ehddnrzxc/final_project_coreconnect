package com.goodee.coreconnect.account.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.goodee.coreconnect.account.entity.AccountLog;
import com.goodee.coreconnect.account.entity.LogActionType;

public interface AccountLogRepository extends JpaRepository<AccountLog, Long>{

    /**
     * 모든 로그인 이력 조회 (최신순)
     */
    Page<AccountLog> findAllByOrderByActionTimeDesc(Pageable pageable);

    /**
     * 특정 사용자의 로그인 이력 조회 (최신순)
     */
    @Query("SELECT al FROM AccountLog al WHERE al.user.email = :email ORDER BY al.actionTime DESC")
    Page<AccountLog> findByUserEmailOrderByActionTimeDesc(
        @Param("email") String email,
        Pageable pageable
    );

    /**
     * 특정 액션 타입의 로그인 이력 조회 (최신순)
     */
    Page<AccountLog> findByActionTypeOrderByActionTimeDesc(LogActionType actionType, Pageable pageable);

    /**
     * 사용자 이메일과 액션 타입으로 조회 (최신순)
     */
    @Query("SELECT al FROM AccountLog al WHERE al.user.email = :email AND al.actionType = :actionType ORDER BY al.actionTime DESC")
    Page<AccountLog> findByUserEmailAndActionTypeOrderByActionTimeDesc(
        @Param("email") String email,
        @Param("actionType") LogActionType actionType,
        Pageable pageable
    );
}
