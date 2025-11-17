package com.goodee.coreconnect.attendance.dto.response;

/** 주간/월간 통계용 DTO */
public record AttendanceStatisticsDTO(
    int workDays,        
    int lateDays,        
    int absentDays,      
    int totalWorkMinutes 
) {}


