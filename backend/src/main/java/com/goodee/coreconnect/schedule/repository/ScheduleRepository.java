package com.goodee.coreconnect.schedule.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.goodee.coreconnect.schedule.entity.MeetingRoom;
import com.goodee.coreconnect.schedule.entity.Schedule;
import com.goodee.coreconnect.user.entity.User;

import io.lettuce.core.dynamic.annotation.Param;

public interface ScheduleRepository extends JpaRepository<Schedule, Integer> {

  /** 특정 유저의 일정 목록 조회 */
  List<Schedule> getByUser(User user);

  /**
   * 같은 회의실에서 겹치는 시간대가 있는 일정이 존재하는지 확인
   * (시작시간 < 기존 종료시간 && 종료시간 > 기존 시작시간)
   */
  @Query("SELECT s FROM Schedule s " +
         "WHERE s.meetingRoom = :meetingRoom " +
         "AND s.deletedYn = false " +
         "AND (:start < s.endDateTime AND :end > s.startDateTime)")
  List<Schedule> getOverlappingSchedules(
          @Param("meetingRoom") MeetingRoom meetingRoom,
          @Param("start") LocalDateTime start,
          @Param("end") LocalDateTime end
  );

}
