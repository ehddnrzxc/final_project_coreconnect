package com.goodee.coreconnect.schedule.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/** 대시보드용 - 월간 일정 요약 DTO */
@Getter
@Builder
@AllArgsConstructor
public class ScheduleMonthlySummaryDTO {

    private final int year;
    private final int month;
    private final int totalDays;
    private final List<ScheduleDailySummaryDTO> days;
}
