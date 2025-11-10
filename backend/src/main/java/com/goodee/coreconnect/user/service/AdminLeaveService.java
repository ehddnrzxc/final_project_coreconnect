package com.goodee.coreconnect.user.service;

import java.util.List;

import com.goodee.coreconnect.user.dto.request.AdminLeaveRequestDTO;

public interface AdminLeaveService {
  
  /** 전체 휴가 요청 목록(최근 신청 순) */
  public List<AdminLeaveRequestDTO> getAllLeaveRequests();
  
  /** 대기(PENDING) 상태인 휴가 요청만 */
  public List<AdminLeaveRequestDTO> getPendingLeaveRequests();
  
  /** 휴가 승인 */
  public void approveLeave(Integer leaveReqId);
  
  /** 휴가 반려 */
  public void rejectLeave(Integer leaveReqId, String reason);

}
