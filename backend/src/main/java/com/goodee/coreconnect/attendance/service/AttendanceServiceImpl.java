package com.goodee.coreconnect.attendance.service;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.attendance.AttendanceConstants;
import com.goodee.coreconnect.attendance.dto.response.TodayAttendanceResponseDTO;
import com.goodee.coreconnect.attendance.entity.Attendance;
import com.goodee.coreconnect.attendance.entity.AttendanceStatus;
import com.goodee.coreconnect.attendance.repository.AttendanceRepository;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AttendanceServiceImpl implements AttendanceService {
  
  private final AttendanceRepository attendanceRepository;
  private final UserRepository userRepository;
  
  /** 출근 처리 */
  public void checkIn(String email) {
    LocalDate today = LocalDate.now();
    LocalDateTime now = LocalDateTime.now();
    LocalTime nowTime = now.toLocalTime();
    
    // 이미 오늘 출근 기록이 있는지 확인
    attendanceRepository.findByUser_EmailAndWorkDate(email, today)
                        .ifPresent(att -> {
                          throw new IllegalStateException("이미 오늘 출근 기록이 있습니다.");
                        });
    
    // 이메일로 유저 찾기
    User user = userRepository.findByEmail(email)
                              .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다: " + email));
    
    // 지각 여부 판별
    AttendanceStatus status;
    if(nowTime.isAfter(AttendanceConstants.STANDARD_START_TIME)) {
      status = AttendanceStatus.LATE; // 기준 시간 이후면 지각처리
    } else {
      status = AttendanceStatus.PRESENT;
    }
    
    Attendance attendance = Attendance.createAttendance(user, status, null, now);
    attendance.setWorkDate(today);
    attendance.setCreatedAt(now);
    attendance.setUpdatedAt(now);
    
    attendanceRepository.save(attendance);
  }
  
  /** 퇴근 처리 */
  public void checkOut(String email) {
    LocalDate today = LocalDate.now();
    
    Attendance attendance = attendanceRepository.findByUser_EmailAndWorkDate(email, today)
                                                .orElseThrow(() -> new IllegalStateException("오늘 출근 기록이 없습니다."));
    if(attendance.getCheckOut() != null) {
      throw new IllegalStateException("이미 퇴근 처리가 완료되었습니다.");
    }
    
    attendance.checkOut(AttendanceConstants.STANDARD_END_TIME);
    attendance.setUpdatedAt(today.atStartOfDay());
  }
  
  /** 오늘 근태 조회 */
  @Transactional(readOnly = true)
  public TodayAttendanceResponseDTO getTodayAttendance(String email) {
    LocalDate today = LocalDate.now();
    
    return attendanceRepository
             .findByUser_EmailAndWorkDate(email, today)
             .map(att -> new TodayAttendanceResponseDTO(
                att.getWorkDate(),
                att.getCheckIn(),
                att.getCheckOut(),
                att.getStatus()
              ))
             .orElseGet(() -> new TodayAttendanceResponseDTO(
                   today,
                   null,
                   null,
                   AttendanceStatus.ABSENT
                 ));
  }

  /** 주간 누적 근무 시간 구하기 */
  @Override
  @Transactional(readOnly = true)
  public int getWeeklyWorkMinutes(String email, LocalDate anyDateInWeek) {
    
    // 이메일로 사용자 조회
    User user = userRepository.findByEmail(email)
                              .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다: " + email));
    
    // 현재 일이 속한 주의 월요일 ~ 일요일 구하기
    LocalDate startOfWeek = anyDateInWeek.with(DayOfWeek.MONDAY);
    LocalDate endOfWeek = startOfWeek.plusDays(6);
    
    // 해당 주의 근태 기록 모두 조회
    List<Attendance> attendanceList = attendanceRepository.findByUser_IdAndWorkDateBetween(user.getId(), startOfWeek, endOfWeek);
    LocalDate today = LocalDate.now();
    int totalMinutes = 0;
    
    for(Attendance att : attendanceList) {
      LocalDate workDate = att.getWorkDate();
      LocalDateTime checkIn = att.getCheckIn();
      LocalDateTime checkOut = att.getCheckOut();
      
      // 출근 기록이 없으면 스킵
      if(checkIn == null) { continue; }
      
      LocalDateTime endDateTime;
      
      if(checkOut != null) {
        // 정상적으로 퇴근한 날
        endDateTime = checkOut;
      } else if(workDate.equals(today)) {
        // 오늘인데 아직 퇴근 안 찍은 경우 -> 지금까지 근무한 시간 포함
        endDateTime = LocalDateTime.now();
      } else {
        // 과거인데 퇴근 시간이 없다면 -> 0분으로 처리
        continue;
      }
      
      long minutes = Duration.between(checkIn, endDateTime).toMinutes();
      
      if(minutes > 0) {
        totalMinutes += (int) minutes;
      }
    }
   
    return totalMinutes;
  }
}
