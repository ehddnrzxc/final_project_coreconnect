package com.goodee.coreconnect.attendance.dto.response;

import java.util.List;

/** 주간 근태 상세 정보 DTO */
public record WeeklyAttendanceDetailDTO(
    List<DailyAttendanceDTO> dailyAttendances  
) {}

