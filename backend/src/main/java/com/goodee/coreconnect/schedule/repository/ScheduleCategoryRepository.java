package com.goodee.coreconnect.schedule.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.schedule.entity.ScheduleCategory;
import com.goodee.coreconnect.user.entity.User;

public interface ScheduleCategoryRepository extends JpaRepository<ScheduleCategory, Integer> {

  /** 특정 유저의 일정 카테고리 목록 조회 */
  List<ScheduleCategory> getByUser(User user);

}
