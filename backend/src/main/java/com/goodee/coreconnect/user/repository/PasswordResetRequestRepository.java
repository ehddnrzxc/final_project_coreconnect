package com.goodee.coreconnect.user.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.user.entity.PasswordResetRequest;
import com.goodee.coreconnect.user.entity.ResetStatus;

public interface PasswordResetRequestRepository extends JpaRepository<PasswordResetRequest, Long> {
  List<PasswordResetRequest> findByStatus(ResetStatus status);
}
