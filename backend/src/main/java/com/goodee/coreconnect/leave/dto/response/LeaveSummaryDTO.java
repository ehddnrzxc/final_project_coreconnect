package com.goodee.coreconnect.leave.dto.response;

public record LeaveSummaryDTO(
    Integer totalAnnualLeaveDays,
    Integer usedAnnualLeaveDays,
    Integer remainingAnnualLeaveDays,
    Double usedRate
) {}
