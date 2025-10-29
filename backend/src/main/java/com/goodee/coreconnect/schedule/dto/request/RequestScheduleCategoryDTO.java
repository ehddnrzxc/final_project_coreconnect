package com.goodee.coreconnect.schedule.dto.request;

import com.goodee.coreconnect.schedule.entity.ScheduleCategory;
import com.goodee.coreconnect.user.entity.User;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
  
  @NotBlank(message = "카테고리 이름은 필수입니다.")
  @Size(max = 50, message = "카테고리 이름은 50자 이하로 입력해주세요.")
  private String name;
  
  private boolean defaultYn;

  /** DTO → Entity 변환 */
  public ScheduleCategory toEntity(User user) {
    
    return ScheduleCategory.createScheduleCategory(user, name, defaultYn);
    
  }

  
}
