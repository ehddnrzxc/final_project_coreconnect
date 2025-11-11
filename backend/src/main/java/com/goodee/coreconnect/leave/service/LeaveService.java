package com.goodee.coreconnect.leave.service;

import java.util.List;

import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.leave.dto.request.CreateLeaveRequestDTO;
import com.goodee.coreconnect.leave.dto.response.LeaveRequestResponseDTO;
import com.goodee.coreconnect.leave.dto.response.LeaveSummaryDTO;
import com.goodee.coreconnect.user.entity.User;

public interface LeaveService {
  
//  /** 휴가 신청 */
//  public LeaveRequestResponseDTO createLeaveRequest(String email, CreateLeaveRequestDTO dto);
  
  /** 내 휴가 신청 목록 조회 */
  public List<LeaveRequestResponseDTO> getMyLeaveRequests(String email);
  
  /** 전자결재 연동 휴가 생성 */
  public void createLeaveFromApproval(Document document, User drafter, CreateLeaveRequestDTO dto);
  
  /** 승인된 휴가 처리 */
  public void handleApprovedLeave(Document document, String approvalComment);
  
  /** 반려된 휴가 처리 */
  public void handleRejectedLeave(Document document, String rejectComment);
  
  /** 내 연차 요약 */
  LeaveSummaryDTO getMyLeaveSummary(String email);
}
