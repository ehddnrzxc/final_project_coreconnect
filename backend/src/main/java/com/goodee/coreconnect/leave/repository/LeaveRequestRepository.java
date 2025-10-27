package com.goodee.coreconnect.leave.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.leave.entity.LeaveRequest;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Integer> {


}
