package com.goodee.coreconnect.user.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.user.entity.PasswordResetRequest;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.enums.ResetStatus;

public interface PasswordResetRequestRepository extends JpaRepository<PasswordResetRequest, Long> {
  List<PasswordResetRequest> findByStatusOrderByCreatedAtDesc(ResetStatus status);
  
  List<PasswordResetRequest> findAllByOrderByCreatedAtDesc();
  
  List<PasswordResetRequest> findByUserAndStatus(User user, ResetStatus status);
}
