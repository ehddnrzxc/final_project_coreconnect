package com.goodee.coreconnect.schedule.dto.response;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/** 대시보드용 - 하루 일정 요약 DTO */
@Getter
@Builder
@AllArgsConstructor
public class ScheduleDailySummaryDTO {

    private final LocalDate date;
    private final int count;
    private final List<SchedulePreviewSummaryDTO> items;
}
