package com.goodee.coreconnect.account.dto.response;

import java.time.LocalDateTime;

import com.goodee.coreconnect.account.entity.AccountLog;
import com.goodee.coreconnect.account.entity.LogActionType;

/**
 * 로그인 이력 응답 DTO
 */
public record AccountLogResponseDTO(
    Long logId,
    String userEmail,
    String userName,
    LogActionType actionType,
    LocalDateTime actionTime,
    String ipAddress
) {
    public static AccountLogResponseDTO fromEntity(AccountLog log) {
        return new AccountLogResponseDTO(
            log.getLogId(),
            log.getUser().getEmail(),
            log.getUser().getName(),
            log.getActionType(),
            log.getActionTime(),
            log.getIpAddress()
        );
    }
}

