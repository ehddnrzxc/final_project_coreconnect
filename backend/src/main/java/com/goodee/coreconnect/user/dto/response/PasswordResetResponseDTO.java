package com.goodee.coreconnect.user.dto.response;

import java.time.LocalDateTime;

import com.goodee.coreconnect.user.entity.PasswordResetRequest;
import com.goodee.coreconnect.user.entity.ResetStatus;

public record PasswordResetResponseDTO(
    Long id,
    String userEmail,
    String userName,
    String reason,
    ResetStatus status,
    LocalDateTime createdAt,
    LocalDateTime processedAt
) {
    public static PasswordResetResponseDTO fromEntity(PasswordResetRequest req) {
        return new PasswordResetResponseDTO(
            req.getId(),
            req.getUser().getEmail(),
            req.getUser().getName(),
            req.getReason(),
            req.getStatus(),
            req.getCreatedAt(),
            req.getProcessedAt()
        );
    }
}

