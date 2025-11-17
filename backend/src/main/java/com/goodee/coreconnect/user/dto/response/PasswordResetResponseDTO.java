package com.goodee.coreconnect.user.dto.response;

import java.time.LocalDateTime;

import com.goodee.coreconnect.user.entity.PasswordResetRequest;
import com.goodee.coreconnect.user.entity.ResetStatus;

/** 비밀번호 초기화 요청 응답 DTO */
public record PasswordResetResponseDTO(
    Long id,
    String userEmail,
    String userName,
    String reason,
    ResetStatus status,
    LocalDateTime createdAt,
    LocalDateTime processedAt,
    String rejectReason
) {
    public static PasswordResetResponseDTO fromEntity(PasswordResetRequest req) {
        return new PasswordResetResponseDTO(
            req.getId(),
            req.getUser().getEmail(),
            req.getUser().getName(),
            req.getReason(),
            req.getStatus(),
            req.getCreatedAt(),
            req.getProcessedAt(),
            req.getRejectReason()
        );
    }
}

