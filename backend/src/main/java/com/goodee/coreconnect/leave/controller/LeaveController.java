package com.goodee.coreconnect.leave.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.leave.dto.request.CreateLeaveRequestDTO;
import com.goodee.coreconnect.leave.dto.response.LeaveRequestResponseDTO;
import com.goodee.coreconnect.leave.dto.response.LeaveSummaryDTO;
import com.goodee.coreconnect.leave.service.LeaveService;
import com.goodee.coreconnect.security.userdetails.CustomUserDetails;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/leave")
public class LeaveController {
  
  private final LeaveService leaveService;
  
//  /** 휴가 신청 */
//  @PostMapping
//  public ResponseEntity<LeaveRequestResponseDTO> createLeave(
//      @AuthenticationPrincipal CustomUserDetails user,
//      @RequestBody @Valid CreateLeaveRequestDTO dto
//  ) {
//    String email = user.getEmail();
//    LeaveRequestResponseDTO res = leaveService.createLeaveRequest(email, dto);
//    return ResponseEntity.status(HttpStatus.CREATED).body(res);
//  }
  
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
}
