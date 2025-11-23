package com.goodee.coreconnect.leave.dto.response;

import java.time.LocalDate;

/**
 * 주 단위 휴가자 수 조회용 DTO
 */
public record CompanyLeaveWeeklyDTO(
    LocalDate date,      // 날짜
    Integer leaveCount   // 해당 날짜의 휴가자 수
) {
}

