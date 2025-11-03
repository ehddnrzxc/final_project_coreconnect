package com.goodee.coreconnect.schedule.dto.response;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.goodee.coreconnect.schedule.entity.ScheduleCategory;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@NoArgsConstructor
@Getter
@ToString
public class ResponseScheduleCategoryDTO {

  private Integer id;
  
  private String name;
  
  private boolean defaultYn;
  
  @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
  private LocalDateTime createdAt;
  
  @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
  private LocalDateTime updatedAt;
  
  private String userName;

  /** Entity → DTO 변환 */
  public static ResponseScheduleCategoryDTO toDTO(ScheduleCategory entity) {
    
    ResponseScheduleCategoryDTO dto = new ResponseScheduleCategoryDTO();
    
    dto.id = entity.getId();
    dto.name = entity.getName();
    dto.defaultYn = entity.getDefaultYn();
    dto.createdAt = entity.getCreatedAt();
    dto.updatedAt = entity.getUpdatedAt();
    
    if (entity.getUser() != null) {
      dto.userName = entity.getUser().getName();
    }
    return dto;
  }
  
}
