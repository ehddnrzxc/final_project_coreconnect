package com.goodee.coreconnect.attendance.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.goodee.coreconnect.attendance.entity.AttendanceStatus;

public record TodayAttendanceResponseDTO(
    LocalDate workDate, // 근무일
    LocalDateTime checkIn, // 출근
    LocalDateTime checkOut, // 퇴근
    AttendanceStatus status // 상태 
    ) {}
