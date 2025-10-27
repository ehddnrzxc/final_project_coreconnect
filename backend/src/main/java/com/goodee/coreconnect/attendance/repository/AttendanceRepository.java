package com.goodee.coreconnect.attendance.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.attendance.entity.Attendance;

public interface AttendanceRepository extends JpaRepository<Attendance, Integer> {

}
