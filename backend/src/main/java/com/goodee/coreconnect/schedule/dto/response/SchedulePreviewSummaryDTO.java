package com.goodee.coreconnect.schedule.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/** 대시보드용 - 일정 미리보기 정보 DTO */
@Getter
@Builder
@AllArgsConstructor
public class SchedulePreviewSummaryDTO {

    private final Integer id;
    private final String title;
    private final LocalDateTime startDateTime;
    private final LocalDateTime endDateTime;
    private final String location;
    private final String categoryName;
    private final String visibility;
}
