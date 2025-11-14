package com.goodee.coreconnect.admin.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.admin.dto.request.AdminLeaveRequestDTO;
import com.goodee.coreconnect.admin.service.AdminLeaveService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/leave")
@PreAuthorize("hasRole('ADMIN')")
public class AdminLeaveController {
  
  private final AdminLeaveService adminLeaveService;
  
  /** 전체 휴가 요청 목록 */
  @GetMapping
  public List<AdminLeaveRequestDTO> getAllLeaveRequests() {
    return adminLeaveService.getAllLeaveRequests();
  }
  
  /** 대기중(PENDING) 휴가만 */
  @GetMapping("/pending")
  public List<AdminLeaveRequestDTO> getPendingLeaveRequests() {
    return adminLeaveService.getPendingLeaveRequests();
  }
}
