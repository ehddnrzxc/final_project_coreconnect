package com.goodee.coreconnect.leave.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.leave.dto.request.CreateLeaveRequestDTO;
import com.goodee.coreconnect.leave.dto.response.LeaveRequestResponseDTO;
import com.goodee.coreconnect.leave.entity.LeaveRequest;
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

  /** 휴가 신청 */
  @Override
  public LeaveRequestResponseDTO createLeaveRequest(String email, CreateLeaveRequestDTO dto) {
    User user = userRepository.findByEmail(email)
                              .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    LeaveRequest leave = dto.toEntity(user);
    LeaveRequest saved = leaveRequestRepository.save(leave);
    return LeaveRequestResponseDTO.toDTO(saved);
  }

  /** 내 휴가 신청 목록 조회 */
  @Override
  @Transactional(readOnly = true)
  public List<LeaveRequestResponseDTO> getMyLeaveRequests(String email) {
    return leaveRequestRepository.findByUser_EmailOrderByStartDateDesc(email)
                                 .stream()
                                 .map(LeaveRequestResponseDTO::toDTO)
                                 .toList();
  }

}
