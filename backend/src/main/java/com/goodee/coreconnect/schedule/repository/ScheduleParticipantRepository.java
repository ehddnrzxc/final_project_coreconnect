package com.goodee.coreconnect.schedule.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.schedule.entity.Schedule;
import com.goodee.coreconnect.schedule.entity.ScheduleParticipant;
import com.goodee.coreconnect.schedule.enums.ScheduleRole;
import com.goodee.coreconnect.user.entity.User;

public interface ScheduleParticipantRepository extends JpaRepository<ScheduleParticipant, Integer> {

  /** 특정 일정에 속한 참여자 목록 (삭제 제외) */
  List<ScheduleParticipant> findByScheduleAndDeletedYnFalse(Schedule schedule);

  /** 특정 유저가 참여한 일정 목록 (삭제 제외) */
  List<ScheduleParticipant> findByUserAndDeletedYnFalse(User user);
  
  /** 특정 유저가 특정 역할로 참여 중인 일정 (삭제 제외) */
  List<ScheduleParticipant> findByUserAndRoleAndDeletedYnFalse(User user, ScheduleRole role);

}
