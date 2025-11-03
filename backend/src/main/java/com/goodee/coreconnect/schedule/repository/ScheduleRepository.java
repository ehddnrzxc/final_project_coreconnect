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
  
  /** 특정 유저의 일정 목록 (삭제 제외) */
  List<Schedule> findByUserAndDeletedYnFalse(User user);

  /** 특정 회의실의 일정 목록 (삭제 제외) */
  List<Schedule> findByMeetingRoomAndDeletedYnFalse(MeetingRoom meetingRoom);
  
  /** 특정 카테고리에 속한 '삭제되지 않은' 일정 목록 조회 */
  List<Schedule> findByCategoryAndDeletedYnFalse(ScheduleCategory category);

  /**
   * 같은 회의실에서 겹치는 시간대가 있는 일정이 존재하는지 확인
   * (시작시간 < 기존 종료시간 && 종료시간 > 기존 시작시간)
   */
  @Query("SELECT s FROM Schedule s " +
         "WHERE s.meetingRoom = :meetingRoom " +
         "AND s.deletedYn = false " +
         "AND (:start < s.endDateTime AND :end > s.startDateTime)")
  List<Schedule> findOverlappingSchedules(
          @Param("meetingRoom") MeetingRoom meetingRoom,
          @Param("start") LocalDateTime start,
          @Param("end") LocalDateTime end
  );

}
