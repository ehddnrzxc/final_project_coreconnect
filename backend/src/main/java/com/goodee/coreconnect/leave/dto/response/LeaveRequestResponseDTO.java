package com.goodee.coreconnect.leave.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.goodee.coreconnect.leave.entity.LeaveRequest;
import com.goodee.coreconnect.leave.entity.LeaveStatus;

public record LeaveRequestResponseDTO(
  Integer LeaveReqId,
  LocalDate startDate,
  LocalDate endDate,
  String type,
  String reason,
  LeaveStatus status,
  LocalDateTime approvedDate
) {
  /** Entity -> DTO 변환 메소드 */
  public static LeaveRequestResponseDTO toDTO(LeaveRequest entity) {
    return new LeaveRequestResponseDTO(
        entity.getLeaveReqId(),
        entity.getStartDate(),
        entity.getEndDate(),
        entity.getType(),
        entity.getReason(),
        entity.getStatus(),
        entity.getApprovedDate()
    );
  }
}
