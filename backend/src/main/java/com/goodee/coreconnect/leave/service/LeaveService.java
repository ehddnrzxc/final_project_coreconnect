package com.goodee.coreconnect.leave.service;

import java.util.List;

import java.time.LocalDate;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.leave.dto.response.CompanyLeaveDetailDTO;
import com.goodee.coreconnect.leave.dto.response.CompanyLeaveWeeklyDTO;
import com.goodee.coreconnect.leave.dto.response.LeaveRequestResponseDTO;
import com.goodee.coreconnect.leave.dto.response.LeaveSummaryDTO;
import com.goodee.coreconnect.user.entity.User;

public interface LeaveService {
  
//  /** 휴가 신청 */
//  public LeaveRequestResponseDTO createLeaveRequest(String email, CreateLeaveRequestDTO dto);
  
  /** 내 휴가 신청 목록 조회 */
  public List<LeaveRequestResponseDTO> getMyLeaveRequests(String email);
  
  /** 전자결재 연동 휴가 생성 */
  public void createLeaveFromApproval(Document document, User drafter, LocalDate startDate, LocalDate endDate, String typeLabel, String reason);
  
  /** 승인된 휴가 처리 */
  public void handleApprovedLeave(Document document, String approvalComment);
  
  /** 반려된 휴가 처리 */
  public void handleRejectedLeave(Document document, String rejectComment);
  
  /** 내 연차 요약 */
  LeaveSummaryDTO getMyLeaveSummary(String email);
  
  /** 주 단위 휴가자 수 조회 */
  List<CompanyLeaveWeeklyDTO> getCompanyLeaveWeekly(LocalDate startDate, LocalDate endDate);
  
  /** 전사 휴가 상세 목록 조회 */
  Page<CompanyLeaveDetailDTO> getCompanyLeaveDetails(
      LocalDate startDate, 
      LocalDate endDate, 
      String leaveType, 
      Pageable pageable
  );
}
