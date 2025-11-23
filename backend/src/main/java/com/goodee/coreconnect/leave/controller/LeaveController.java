package com.goodee.coreconnect.leave.controller;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.leave.dto.response.CompanyLeaveDetailDTO;
import com.goodee.coreconnect.leave.dto.response.CompanyLeaveWeeklyDTO;
import com.goodee.coreconnect.leave.dto.response.LeaveRequestResponseDTO;
import com.goodee.coreconnect.leave.dto.response.LeaveSummaryDTO;
import com.goodee.coreconnect.leave.dto.response.LeaveTypeResponseDTO;
import com.goodee.coreconnect.leave.enums.LeaveType;
import com.goodee.coreconnect.leave.service.LeaveService;
import com.goodee.coreconnect.security.userdetails.CustomUserDetails;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/leave")
public class LeaveController {
  
  private final LeaveService leaveService;
  
  /** 휴가 신청 내역 조회 */
  @GetMapping("/me")
  public List<LeaveRequestResponseDTO> getMyLeaves(@AuthenticationPrincipal CustomUserDetails user) {
    String email = user.getEmail();
    return leaveService.getMyLeaveRequests(email);
  }
  
  /** 연차 정보 조회 */
  @GetMapping("/summary")
  public ResponseEntity<LeaveSummaryDTO> getMyLeaveSummary(
      @AuthenticationPrincipal CustomUserDetails user) {
    String email = user.getEmail();
    LeaveSummaryDTO summary = leaveService.getMyLeaveSummary(email);
    return ResponseEntity.ok(summary);
  }
  
  /** 주 단위 휴가자 수 조회 */
  @GetMapping("/company/weekly")
  public ResponseEntity<List<CompanyLeaveWeeklyDTO>> getCompanyLeaveWeekly(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
  ) {
    List<CompanyLeaveWeeklyDTO> weeklyData = leaveService.getCompanyLeaveWeekly(startDate, endDate);
    return ResponseEntity.ok(weeklyData);
  }
  
  /** 전사 휴가 상세 목록 조회 */
  @GetMapping("/company/details")
  public ResponseEntity<Page<CompanyLeaveDetailDTO>> getCompanyLeaveDetails(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
      @RequestParam(required = false) String leaveType,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "50") int size
  ) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("startDate").descending());
    Page<CompanyLeaveDetailDTO> details = leaveService.getCompanyLeaveDetails(
        startDate, 
        endDate, 
        leaveType, 
        pageable
    );
    return ResponseEntity.ok(details);
  }
  
  /** 휴가 유형 목록 조회 */
  @GetMapping("/types")
  public ResponseEntity<List<LeaveTypeResponseDTO>> getLeaveTypes() {
    List<LeaveTypeResponseDTO> types = Arrays.stream(LeaveType.values())
        .map(type -> new LeaveTypeResponseDTO(type))
        .toList();
    return ResponseEntity.ok(types);
  }
}
