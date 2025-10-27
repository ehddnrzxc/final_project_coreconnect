package com.goodee.coreconnect.schedule.dto.request;

import com.goodee.coreconnect.schedule.entity.ScheduleCategory;
import com.goodee.coreconnect.user.entity.User;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RequestScheduleCategoryDTO {

  private Integer userId;
  private String name;
  private boolean defaultYn;

  /** DTO → Entity 변환 */
  public ScheduleCategory toEntity(User user) {
      return ScheduleCategory.createScheduleCategory(user, name, defaultYn);
  }

  
}
