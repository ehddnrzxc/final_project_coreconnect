package com.goodee.coreconnect.leave.service;

import java.util.List;

import com.goodee.coreconnect.leave.dto.request.CreateLeaveRequestDTO;
import com.goodee.coreconnect.leave.dto.response.LeaveRequestResponseDTO;

public interface LeaveService {
  
  /** 휴가 신청 */
  public LeaveRequestResponseDTO createLeaveRequest(String email, CreateLeaveRequestDTO dto);
  
  /** 내 휴가 신청 목록 조회 */
  public List<LeaveRequestResponseDTO> getMyLeaveRequests(String email);
}
