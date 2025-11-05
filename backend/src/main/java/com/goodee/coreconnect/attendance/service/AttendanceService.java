package com.goodee.coreconnect.attendance.service;

import com.goodee.coreconnect.attendance.dto.response.TodayAttendanceResponseDTO;

public interface AttendanceService {
  
  /** 출근 처리 */
  public void checkIn(String email);
  
  /** 퇴근 처리 */
  public void checkOut(String email);
  
  /** 오늘 내 근태 조회 */
  public TodayAttendanceResponseDTO getTodayAttendance(String email);
  
  

}
