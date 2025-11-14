package com.goodee.coreconnect.admin.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.admin.dto.request.AdminLeaveRequestDTO;
import com.goodee.coreconnect.leave.entity.LeaveRequest;
import com.goodee.coreconnect.leave.entity.LeaveStatus;
import com.goodee.coreconnect.leave.repository.LeaveRequestRepository;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminLeaveServiceImpl implements AdminLeaveService {
  
  private final LeaveRequestRepository leaveRequestRepository;
  
  /** 전체 휴가 요청 목록(최근 신청 순) */
  @Override
  @Transactional(readOnly = true)
  public List<AdminLeaveRequestDTO> getAllLeaveRequests() {
    return leaveRequestRepository.findAll()
                                 .stream()
                                 .sorted((a, b) -> b.getStartDate().compareTo(a.getStartDate())) // 신청일 기준으로 내림차순 정렬
                                 .map(AdminLeaveRequestDTO::toDTO)
                                 .toList();
  }
  
  /** 대기(PENDING) 상태인 휴가 요청만 */
  @Override
  @Transactional(readOnly = true)
  public List<AdminLeaveRequestDTO> getPendingLeaveRequests() {
    return leaveRequestRepository.findAll()
                                 .stream()
                                 .filter(leave -> leave.getStatus() == LeaveStatus.PENDING)
                                 .sorted((a, b) -> a.getStartDate().compareTo(b.getStartDate()))
                                 .map(AdminLeaveRequestDTO::toDTO)
                                 .toList();
  }

}
