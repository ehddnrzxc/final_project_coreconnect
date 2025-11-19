package com.goodee.coreconnect.admin.dto.request;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.goodee.coreconnect.leave.entity.LeaveRequest;
import com.goodee.coreconnect.leave.enums.LeaveType;
import com.goodee.coreconnect.leave.enums.LeaveStatus;

/** 휴가신청 관리자 응답용 DTO */
public record AdminLeaveRequestDTO(
  Integer leaveReqId,
  String username,
  String email,
  LocalDate startDate,
  LocalDate endDate,
  LeaveType type,
  String reason,
  LeaveStatus status,
  LocalDateTime approvedDate
) {
  /** Entity -> DTO 변환 메소드 */
  public static AdminLeaveRequestDTO toDTO(LeaveRequest entity) {
    return new AdminLeaveRequestDTO(entity.getLeaveReqId(),
                                    entity.getUser().getName(), 
                                    entity.getUser().getEmail(), 
                                    entity.getStartDate(), 
                                    entity.getEndDate(), 
                                    entity.getType(), 
                                    entity.getReason(), 
                                    entity.getStatus(), 
                                    entity.getApprovedDate()
    );
    
  }
}