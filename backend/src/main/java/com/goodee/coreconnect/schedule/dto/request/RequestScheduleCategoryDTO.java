package com.goodee.coreconnect.schedule.dto.request;

import com.goodee.coreconnect.schedule.entity.ScheduleCategory;
import com.goodee.coreconnect.user.entity.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@ToString
public class RequestScheduleCategoryDTO {

  private Integer userId;
  private String name;
  private boolean defaultYn;

  /** DTO → Entity 변환 */
  public ScheduleCategory toEntity(User user) {
    
    return ScheduleCategory.createScheduleCategory(user, name, defaultYn);
    
  }

  
}
