package com.goodee.coreconnect.leave.dto.response;

import java.time.LocalDate;
import java.util.List;

import com.goodee.coreconnect.leave.enums.LeaveType;

/**
 * 전사 휴가 상세 목록 조회용 DTO
 */
public record CompanyLeaveDetailDTO(
    Integer leaveReqId,           // 휴가 신청 ID
    Integer userId,                // 사용자 ID
    String employeeNumber,         // 사번
    String employeeName,           // 사원명
    String departmentName,          // 부서명
    String jobGrade,               // 직급
    LeaveType leaveType,           // 휴가유형
    List<LocalDate> leaveDates,    // 휴가사용일 목록 (기간 내 모든 날짜)
    Integer usedDays,              // 사용휴가 (일수)
    Integer leavePeriod            // 휴가사용기간 (일수)
) {
}

