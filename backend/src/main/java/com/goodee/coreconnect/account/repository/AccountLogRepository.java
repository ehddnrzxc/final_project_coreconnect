package com.goodee.coreconnect.account.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.account.entity.AccountLog;

public interface AccountLogRepository extends JpaRepository<AccountLog, Long>{

}
