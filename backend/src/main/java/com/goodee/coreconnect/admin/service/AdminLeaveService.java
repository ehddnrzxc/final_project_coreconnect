package com.goodee.coreconnect.admin.service;

import java.util.List;

import com.goodee.coreconnect.admin.dto.request.AdminLeaveRequestDTO;

public interface AdminLeaveService {
  
  /** 전체 휴가 요청 목록(최근 신청 순) */
  List<AdminLeaveRequestDTO> getAllLeaveRequests();
  
  /** 대기(PENDING) 상태인 휴가 요청만 */
  List<AdminLeaveRequestDTO> getPendingLeaveRequests();
}
