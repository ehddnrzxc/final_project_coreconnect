package com.goodee.coreconnect.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.user.entity.PasswordResetRequest;

public interface PasswordResetRequestRepository extends JpaRepository<PasswordResetRequest, Long> {

}
