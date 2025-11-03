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
