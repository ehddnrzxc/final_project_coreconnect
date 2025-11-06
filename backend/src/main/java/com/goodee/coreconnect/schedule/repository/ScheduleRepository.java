package com.goodee.coreconnect.schedule.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.goodee.coreconnect.schedule.entity.MeetingRoom;
import com.goodee.coreconnect.schedule.entity.Schedule;
import com.goodee.coreconnect.schedule.entity.ScheduleCategory;
import com.goodee.coreconnect.user.entity.User;



public interface ScheduleRepository extends JpaRepository<Schedule, Integer> {

  /** 전체 일정 중 삭제되지 않은 일정 목록 */
  List<Schedule> findByDeletedYnFalse();

  /** 특정 회의실의 일정 목록 (삭제 제외) */
  List<Schedule> findByMeetingRoomAndDeletedYnFalse(MeetingRoom meetingRoom);
  
  /** 특정 카테고리에 속한 '삭제되지 않은' 일정 목록 조회 */
  List<Schedule> findByCategoryAndDeletedYnFalse(ScheduleCategory category);
  
  /**
   * 특정 유저가 OWNER 또는 MEMBER로 포함된 모든 일정 조회
   * (ScheduleParticipant를 JOIN하여 조회)
   */
  @Query("""
      SELECT DISTINCT s FROM ScheduleParticipant sp
      JOIN sp.schedule s
      WHERE sp.user = :user
        AND s.deletedYn = false
        AND sp.deletedYn = false
  """)
  List<Schedule> findUserSchedules(@Param("user") User user);
  
  /** 특정 유저가 해당 시간대에 겹치는 일정이 있는지 검사 (OWNER + MEMBER 모두 포함) */
  @Query("""
      SELECT COUNT(s) > 0
      FROM ScheduleParticipant sp
      JOIN sp.schedule s
      WHERE sp.user = :user
        AND s.deletedYn = false
        AND sp.deletedYn = false
        AND (:start < s.endDateTime AND :end > s.startDateTime)
  """)
  boolean existsUserOverlappingSchedule(
      @Param("user") User user,
      @Param("start") LocalDateTime start,
      @Param("end") LocalDateTime end
  );
  
  /**
   *  특정 유저가 참여 중인 일정 중,
   *  자기 자신(id 제외)과 겹치는 일정이 있는지 검사
   */
  @Query("""
      SELECT COUNT(s) > 0
      FROM ScheduleParticipant sp
      JOIN sp.schedule s
      WHERE sp.user = :user
        AND s.deletedYn = false
        AND sp.deletedYn = false
        AND s.id <> :scheduleId         
        AND (:start < s.endDateTime AND :end > s.startDateTime)
  """)
  boolean existsUserOverlappingScheduleExceptSelf(
      @Param("user") User user,
      @Param("scheduleId") Integer scheduleId,
      @Param("start") LocalDateTime start,
      @Param("end") LocalDateTime end
  );

  /** 
   * 회의실 중복 예약 여부 확인
   * 
   * @param meetingRoom 확인할 회의실 엔티티
   * @param start 새로 예약하려는 시작 시각
   * @param end 새로 예약하려는 종료 시각
   * @return true → 겹침 있음 (예약 불가) / false → 겹침 없음 (예약 가능)
   *
   * JPQL 설명:
   *  - 동일 회의실(meetingRoom)
   *  - 삭제되지 않은 일정(deletedYn = false)
   *  - (새 예약 시작 < 기존 종료) AND (새 예약 종료 > 기존 시작) 조건이면 겹침
   */
  @Query("""
      SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END
      FROM Schedule s
      WHERE s.meetingRoom = :meetingRoom
        AND s.deletedYn = false
        AND (:start < s.endDateTime AND :end > s.startDateTime)
  """)
  boolean existsOverlappingSchedule(
      @Param("meetingRoom") MeetingRoom meetingRoom,
      @Param("start") LocalDateTime start,
      @Param("end") LocalDateTime end
  );

}
