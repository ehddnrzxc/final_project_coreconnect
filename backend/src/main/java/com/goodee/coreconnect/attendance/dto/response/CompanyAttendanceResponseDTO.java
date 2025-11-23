package com.goodee.coreconnect.attendance.dto.response;

import java.time.LocalDateTime;

import com.goodee.coreconnect.attendance.enums.AttendanceStatus;

/** 전사원 근태 현황용 DTO */
public record CompanyAttendanceResponseDTO(
    Integer id,              
    String name,             
    String department,       
    LocalDateTime checkIn,   
    LocalDateTime checkOut, 
    AttendanceStatus status 
) {}


