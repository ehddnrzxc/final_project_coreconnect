package com.goodee.coreconnect.leave.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.leave.entity.LeaveRequest;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Integer> {
  
  // 로그인한 사용자의 휴가 신청 내역(최근 시작일 기준 정렬)
  List<LeaveRequest> findByUser_EmailOrderByStartDateDesc(String email);
}
