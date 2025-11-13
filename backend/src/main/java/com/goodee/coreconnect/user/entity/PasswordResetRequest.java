package com.goodee.coreconnect.user.entity;

import java.time.LocalDateTime;

import com.goodee.coreconnect.user.dto.request.RejectLeaveRequestDTO;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) 
@Table(name = "password_reset_request")
public class PasswordResetRequest {
  
  @Id 
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  
  @ManyToOne(fetch = FetchType.LAZY)
  private User user; // 요청한 사용자
  
  private String reason; // 요청 사유
  
  @Enumerated(EnumType.STRING)
  private ResetStatus status; // PENDING, APPROVED, REJECTED
  
  private LocalDateTime createdAt;
  private LocalDateTime processedAt; 
  
  @ManyToOne(fetch = FetchType.LAZY)
  private User processedBy; // 처리한 관리자
  
  private String rejectReason; // 거절 사유
  
  /** 정적 팩토리 메소드 */
  public static PasswordResetRequest createPasswordResetRequest(
        User user,
        String reason
      ) {
    PasswordResetRequest req = new PasswordResetRequest();
    req.user = user;
    req.reason = reason;
    req.status = ResetStatus.PENDING;
    req.createdAt = LocalDateTime.now();
    
    return req;
  }
  
  /** 승인 처리용 메서드 */
  public void approve(User admin) {
    this.status = ResetStatus.APPROVED;
    this.processedBy = admin;
    this.processedAt = LocalDateTime.now();
    this.rejectReason = null;
  }

  /** 거절 처리용 메서드 */
  public void reject(User admin, RejectLeaveRequestDTO rejectReason) {
    this.status = ResetStatus.REJECTED;
    this.processedBy = admin;
    this.processedAt = LocalDateTime.now();
    this.rejectReason = rejectReason.reason();
  }
}
