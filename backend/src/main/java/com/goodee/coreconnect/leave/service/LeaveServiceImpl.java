package com.goodee.coreconnect.leave.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.leave.dto.response.LeaveRequestResponseDTO;
import com.goodee.coreconnect.leave.dto.response.LeaveSummaryDTO;
import com.goodee.coreconnect.leave.entity.LeaveRequest;
import com.goodee.coreconnect.leave.entity.LeaveStatus;
import com.goodee.coreconnect.leave.repository.LeaveRequestRepository;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class LeaveServiceImpl implements LeaveService {
  
  private final UserRepository userRepository;
  private final LeaveRequestRepository leaveRequestRepository;
  
  private static final Integer DEFAULT_ANNUAL_LEAVE_DAYS = 15;

//  /** 휴가 신청 */
//  @Override
//  public LeaveRequestResponseDTO createLeaveRequest(String email, CreateLeaveRequestDTO dto) {
//    User user = userRepository.findByEmail(email)
//                              .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
//    LeaveRequest leave = dto.toEntity(user);
//    LeaveRequest saved = leaveRequestRepository.save(leave);
//    return LeaveRequestResponseDTO.toDTO(saved);
//  }

  /** 내 휴가 신청 목록 조회 */
  @Override
  @Transactional(readOnly = true)
  public List<LeaveRequestResponseDTO> getMyLeaveRequests(String email) {
    return leaveRequestRepository.findByUser_EmailOrderByCreatedAtDesc(email)
                                 .stream()
                                 .map(LeaveRequestResponseDTO::toDTO)
                                 .toList();
  }

  /** 전자결재 연동 휴가 생성 */
  @Override
  public void createLeaveFromApproval(Document document, User drafter, LocalDate startDate, LocalDate endDate, String type, String reason) {
    LeaveRequest leave = LeaveRequest.createLeaveRequest(drafter, 
                                                         startDate, 
                                                         endDate, 
                                                         type, 
                                                         reason, 
                                                         document.getId());
    leaveRequestRepository.save(leave);
  }

  /** 승인된 휴가 처리 */
  @Override
  public void handleApprovedLeave(Document document, String approvalComment) {
    leaveRequestRepository.findByDocumentId(document.getId())
                          .ifPresent(leave -> leave.approve(approvalComment));
    
  }

  /** 반려된 휴가 처리 */
  @Override
  public void handleRejectedLeave(Document document, String rejectComment) {
    leaveRequestRepository.findByDocumentId(document.getId())
                          .ifPresent(leave -> leave.reject(rejectComment));
  }

  /** 내 연차정보 요약 */
  @Override
  @Transactional(readOnly = true)
  public LeaveSummaryDTO getMyLeaveSummary(String email) {
    
    User user = userRepository.findByEmail(email)
                              .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    Integer currentYear = LocalDate.now().getYear();
    
    // 1. 올해 승인된 연차만 조회
    List<LeaveRequest> approvedAnnualLeaves = leaveRequestRepository.findByUserAndStatusAndTypeAndYear(
        user, 
        LeaveStatus.APPROVED, 
        "연차", 
        currentYear);
    // 2. 사용 연차 일수 계산
    Integer usedDays = approvedAnnualLeaves.stream()
                                           .mapToInt(this::calculateLeaveDays)
                                           .sum();
    Integer total = DEFAULT_ANNUAL_LEAVE_DAYS;
    Integer remaing = Math.max(total - usedDays, 0);
    Double usedRate = total == 0 ? 0.0 : (usedDays * 100 / total);
    
    return new LeaveSummaryDTO(total,
                               usedDays,
                               remaing,
                               usedRate);
  }
  
  /** 휴가 일수 계산 */
  private Integer calculateLeaveDays(LeaveRequest leave) {
    long days = ChronoUnit.DAYS.between(leave.getStartDate(), leave.getEndDate()) + 1;
    return (int) days;
  }
  
  
  
  

}
