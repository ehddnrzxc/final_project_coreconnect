package com.goodee.coreconnect.attendance.service;

import java.time.LocalDate;
import java.util.List;

import com.goodee.coreconnect.attendance.dto.response.AttendanceStatisticsDTO;
import com.goodee.coreconnect.attendance.dto.response.CompanyAttendanceResponseDTO;
import com.goodee.coreconnect.attendance.dto.response.MonthlyAttendanceDetailDTO;
import com.goodee.coreconnect.attendance.dto.response.TodayAttendanceResponseDTO;
import com.goodee.coreconnect.attendance.dto.response.WeeklyAttendanceDetailDTO;

public interface AttendanceService {
  
  /** 출근 처리 */
  public void checkIn(String email);
  
  /** 퇴근 처리 */
  public void checkOut(String email);
  
  /** 오늘 내 근태 조회 */
  public TodayAttendanceResponseDTO getTodayAttendance(String email);
  
  /** 주간 누적 근무 시간(분) 계산 */
  public int getWeeklyWorkMinutes(String email, LocalDate anyDateInWeek);
  
  /** 주간 근태 통계 조회 */
  public AttendanceStatisticsDTO getWeeklyStatistics(String email, LocalDate anyDateInWeek);
  
  /** 월간 근태 통계 조회 */
  public AttendanceStatisticsDTO getMonthlyStatistics(String email, LocalDate anyDateInMonth);
  
  /** 전사원 오늘 근태 현황 조회 */
  public List<CompanyAttendanceResponseDTO> getCompanyAttendanceToday();
  
  /** 주간 일별 근태 상세 조회 */
  public WeeklyAttendanceDetailDTO getWeeklyAttendanceDetail(String email, LocalDate anyDateInWeek);
  
  /** 월간 일별 근태 상세 조회 */
  public MonthlyAttendanceDetailDTO getMonthlyAttendanceDetail(String email, LocalDate anyDateInMonth);

}
