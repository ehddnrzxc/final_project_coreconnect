package com.goodee.coreconnect.schedule.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.goodee.coreconnect.schedule.entity.ScheduleCategory;
import com.goodee.coreconnect.user.entity.User;

public interface ScheduleCategoryRepository extends JpaRepository<ScheduleCategory, Integer> {
  
  /** 해당 유저의 카테고리 + 모든 기본 카테고리 조회 */
  @Query("SELECT c FROM ScheduleCategory c " +
      "WHERE c.deletedYn = false " +
      "AND (c.defaultYn = true OR c.user = :user)")
  List<ScheduleCategory> findAvailableCategories(@Param("user") User user);
  
}
