package com.goodee.coreconnect.account.dto.response;

import java.time.LocalDateTime;

import com.goodee.coreconnect.account.entity.AccountLog;
import com.goodee.coreconnect.account.enums.LogActionType;

/** 로그인 이력 응답 DTO */
public record AccountLogResponseDTO(
    Long logId,
    String userEmail,
    String userName,
    LogActionType actionType,
    LocalDateTime actionTime,
    String ipv4,
    String ipv6
) {
    public static AccountLogResponseDTO toDTO(AccountLog log) {
        return new AccountLogResponseDTO(
            log.getLogId(),
            log.getUser().getEmail(),
            log.getUser().getName(),
            log.getActionType(),
            log.getActionTime(),
            log.getIpv4() != null && !log.getIpv4().isEmpty() ? log.getIpv4() : "-",
            log.getIpv6() != null && !log.getIpv6().isEmpty() ? log.getIpv6() : "-"
        );
    }
}

