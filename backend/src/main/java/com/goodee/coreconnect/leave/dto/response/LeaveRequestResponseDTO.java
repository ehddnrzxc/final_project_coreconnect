package com.goodee.coreconnect.leave.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.goodee.coreconnect.leave.entity.LeaveRequest;
import com.goodee.coreconnect.leave.enums.LeaveStatus;
import com.goodee.coreconnect.leave.enums.LeaveType;

public record LeaveRequestResponseDTO(
  Integer leaveReqId,
  LocalDate startDate,
  LocalDate endDate,
  LeaveType type,
  String reason,
  LeaveStatus status,
  LocalDateTime approvedDate,
  String approvalComment
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
        entity.getApprovedDate(),
        entity.getApprovalComment()
    );
  }
}
