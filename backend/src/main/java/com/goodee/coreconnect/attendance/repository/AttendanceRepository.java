package com.goodee.coreconnect.attendance.repository;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.attendance.entity.Attendance;

public interface AttendanceRepository extends JpaRepository<Attendance, Integer> {
  
  // 오늘자, 특정 유저의 근태 기록 1건 찾기
  Optional<Attendance> findByUser_EmailAndWorkDate(String email, LocalDate workDate);

}
