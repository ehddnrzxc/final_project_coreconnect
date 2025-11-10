package com.goodee.coreconnect.user.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.user.dto.request.AdminLeaveRequestDTO;
import com.goodee.coreconnect.user.dto.request.RejectLeaveRequestDTO;
import com.goodee.coreconnect.user.service.AdminLeaveService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/leave-requests")
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
  
  /** 휴가 승인 */
  @PostMapping("/{id}/approve")
  public ResponseEntity<Void> approve(@PathVariable("id") Integer id) {
    adminLeaveService.approveLeave(id);
    return ResponseEntity.noContent().build();
  }
  
  /** 휴가 반려 */
  @PostMapping("/{id}/reject")
  public ResponseEntity<Void> reject(@PathVariable("id") Integer id,
                                     @RequestBody RejectLeaveRequestDTO dto) {
    adminLeaveService.rejectLeave(id, dto.reason());
    return ResponseEntity.noContent().build();
  }
  
}
