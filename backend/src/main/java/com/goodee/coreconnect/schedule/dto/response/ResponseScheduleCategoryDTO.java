package com.goodee.coreconnect.schedule.dto.response;

import java.time.LocalDate;

import com.goodee.coreconnect.schedule.entity.ScheduleCategory;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResponseScheduleCategoryDTO {

  private Integer id;
  private String name;
  private boolean defaultYn;
  private LocalDate createdAt;
  private String userName;

  /** Entity → DTO 변환 */
  public static ResponseScheduleCategoryDTO toDTO(ScheduleCategory entity) {
    
    ResponseScheduleCategoryDTO dto = new ResponseScheduleCategoryDTO();
    
    dto.setId(entity.getId());
    dto.setName(entity.getName());
    dto.setDefaultYn(entity.getDefaultYn());
    dto.setCreatedAt(entity.getCreatedAt());
    
    if (entity.getUser() != null)
        dto.setUserName(entity.getUser().getName());
    return dto;
  }
  
}
