package com.goodee.coreconnect.attendance.controller;

import java.time.LocalDate;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import com.goodee.coreconnect.attendance.dto.response.AttendanceStatisticsDTO;
import com.goodee.coreconnect.attendance.dto.response.CompanyAttendanceResponseDTO;
import com.goodee.coreconnect.attendance.dto.response.MonthlyAttendanceDetailDTO;
import com.goodee.coreconnect.attendance.dto.response.TodayAttendanceResponseDTO;
import com.goodee.coreconnect.attendance.dto.response.WeeklyAttendanceDetailDTO;
import com.goodee.coreconnect.attendance.service.AttendanceService;
import com.goodee.coreconnect.security.userdetails.CustomUserDetails;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
public class AttendanceController {
  
  private final AttendanceService attendanceService;
  
  /** 출근 찍기 */
  @PostMapping("/check-in")
  public ResponseEntity<Void> checkIn(@AuthenticationPrincipal CustomUserDetails user) {
    String email = user.getEmail();
    attendanceService.checkIn(email);
    return ResponseEntity.ok().build();
  }
  
  /** 퇴근 찍기 */
  @PostMapping("/check-out")
  public ResponseEntity<Void> checkOut(@AuthenticationPrincipal CustomUserDetails user) {
    String email = user.getEmail();
    attendanceService.checkOut(email);
    return ResponseEntity.ok().build();
  }
  
  /** 오늘 내 근태 조회 */
  @GetMapping("/me/today")
  public ResponseEntity<TodayAttendanceResponseDTO> getToday(@AuthenticationPrincipal CustomUserDetails user) {
    String email = user.getEmail();
    TodayAttendanceResponseDTO dto = attendanceService.getTodayAttendance(email);
    return ResponseEntity.ok(dto);
  }
  
  /** 주간 누적 근무시간 구하기 */
  @GetMapping("/me/weekly")
  public Integer getMyWeeklyWorkMinutes(@AuthenticationPrincipal CustomUserDetails user, 
                                        @RequestParam("date") LocalDate date) {
    String email = user.getEmail();
    return attendanceService.getWeeklyWorkMinutes(email, date);
  }

  /** 주간 근태 통계 조회 */
  @GetMapping("/me/weekly-stats")
  public ResponseEntity<AttendanceStatisticsDTO> getWeeklyStatistics(
      @AuthenticationPrincipal CustomUserDetails user,
      @RequestParam("date") LocalDate date) {
    String email = user.getEmail();
    AttendanceStatisticsDTO stats = attendanceService.getWeeklyStatistics(email, date);
    return ResponseEntity.ok(stats);
  }

  /** 월간 근태 통계 조회 */
  @GetMapping("/me/monthly-stats")
  public ResponseEntity<AttendanceStatisticsDTO> getMonthlyStatistics(
      @AuthenticationPrincipal CustomUserDetails user,
      @RequestParam("date") LocalDate date) {
    String email = user.getEmail();
    AttendanceStatisticsDTO stats = attendanceService.getMonthlyStatistics(email, date);
    return ResponseEntity.ok(stats);
  }

  /** 전사원 오늘 근태 현황 조회 */
  @GetMapping("/company/today")
  public ResponseEntity<List<CompanyAttendanceResponseDTO>> getCompanyAttendanceToday() {
    List<CompanyAttendanceResponseDTO> result = attendanceService.getCompanyAttendanceToday();
    return ResponseEntity.ok(result);
  }

  /** 주간 일별 근태 상세 조회 */
  @GetMapping("/me/weekly-detail")
  public ResponseEntity<WeeklyAttendanceDetailDTO> getWeeklyAttendanceDetail(
      @AuthenticationPrincipal CustomUserDetails user,
      @RequestParam("date") LocalDate date) {
    String email = user.getEmail();
    WeeklyAttendanceDetailDTO detail = attendanceService.getWeeklyAttendanceDetail(email, date);
    return ResponseEntity.ok(detail);
  }

  /** 월간 일별 근태 상세 조회 */
  @GetMapping("/me/monthly-detail")
  public ResponseEntity<MonthlyAttendanceDetailDTO> getMonthlyAttendanceDetail(
      @AuthenticationPrincipal CustomUserDetails user,
      @RequestParam("date") LocalDate date) {
    String email = user.getEmail();
    MonthlyAttendanceDetailDTO detail = attendanceService.getMonthlyAttendanceDetail(email, date);
    return ResponseEntity.ok(detail);
  }

}
