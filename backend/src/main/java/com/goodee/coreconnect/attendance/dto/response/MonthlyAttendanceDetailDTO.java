package com.goodee.coreconnect.attendance.dto.response;

import java.util.List;

/** 월간 근태 상세 정보 DTO */
public record MonthlyAttendanceDetailDTO(
    List<DailyAttendanceDTO> dailyAttendances
) {}

