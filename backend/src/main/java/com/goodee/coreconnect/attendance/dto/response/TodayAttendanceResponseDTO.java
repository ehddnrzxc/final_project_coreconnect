package com.goodee.coreconnect.attendance.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.goodee.coreconnect.attendance.entity.AttendanceStatus;

public record TodayAttendanceResponseDTO(
    LocalDate workDate,
    LocalDateTime checkIn,
    LocalDateTime checkOut,
    AttendanceStatus status
    ) {}
