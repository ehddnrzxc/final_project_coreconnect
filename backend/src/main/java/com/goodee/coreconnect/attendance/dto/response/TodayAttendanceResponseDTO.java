package com.goodee.coreconnect.attendance.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.goodee.coreconnect.attendance.enums.AttendanceStatus;

/** 오늘 근태현황 조회용 DTO */
public record TodayAttendanceResponseDTO(
    LocalDate workDate, 
    LocalDateTime checkIn, 
    LocalDateTime checkOut, 
    AttendanceStatus status 
    ) {}
