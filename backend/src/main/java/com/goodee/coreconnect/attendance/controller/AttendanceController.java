package com.goodee.coreconnect.attendance.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.attendance.dto.response.TodayAttendanceResponseDTO;
import com.goodee.coreconnect.attendance.service.AttendanceService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
public class AttendanceController {
  
  private final AttendanceService attendanceService;
  
  /** 출근 찍기 */
  @PostMapping("/check-in")
  public ResponseEntity<Void> checkIn(@AuthenticationPrincipal String email) {
    attendanceService.checkIn(email);
    return ResponseEntity.ok().build();
  }
  
  /** 퇴근 찍기 */
  @PostMapping("/check-out")
  public ResponseEntity<Void> checkOut(@AuthenticationPrincipal String email) {
    attendanceService.checkOut(email);
    return ResponseEntity.ok().build();
  }
  
  /** 오늘 내 근태 조회 */
  @GetMapping("/me/today")
  public ResponseEntity<TodayAttendanceResponseDTO> getToday(@AuthenticationPrincipal String email) {
    TodayAttendanceResponseDTO dto = attendanceService.getTodayAttendance(email);
    return ResponseEntity.ok(dto);
  }

}
