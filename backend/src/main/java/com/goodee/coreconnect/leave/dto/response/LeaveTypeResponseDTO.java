package com.goodee.coreconnect.leave.dto.response;

import com.goodee.coreconnect.leave.enums.LeaveType;

/**
 * 휴가 유형 응답 DTO
 */
public record LeaveTypeResponseDTO(
    LeaveType value  // enum (예: ANNUAL)
) {}

