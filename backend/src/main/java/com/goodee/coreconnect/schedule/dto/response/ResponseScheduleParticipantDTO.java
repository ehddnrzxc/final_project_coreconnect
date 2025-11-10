package com.goodee.coreconnect.schedule.dto.response;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.goodee.coreconnect.schedule.entity.ScheduleParticipant;
import com.goodee.coreconnect.schedule.enums.ScheduleRole;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@NoArgsConstructor
@Getter
@ToString
public class ResponseScheduleParticipantDTO {

  private Integer id;
  
  private Integer scheduleId;
  
  private String scheduleTitle;
  
  private Integer userId;
  
  private String userEmail;
  
  private String userName;
  
  private String deptName;
  
  private ScheduleRole role;
  
  @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
  private LocalDateTime createdAt;
  

  /** Entity → DTO 변환 */
  public static ResponseScheduleParticipantDTO toDTO(ScheduleParticipant entity) {
    ResponseScheduleParticipantDTO dto = new ResponseScheduleParticipantDTO();
    dto.id = entity.getId();

    if (entity.getSchedule() != null) {
      dto.scheduleId = entity.getSchedule().getId();
      dto.scheduleTitle = entity.getSchedule().getTitle();
    }
    if (entity.getUser() != null) {
      dto.userId = entity.getUser().getId();
      dto.userEmail = entity.getUser().getEmail();
      dto.userName = entity.getUser().getName();
      
      if (entity.getUser().getDepartment() != null) {
        dto.deptName = entity.getUser().getDepartment().getDeptName();
      }
    }
    dto.role = entity.getRole();
    dto.createdAt = entity.getCreatedAt();
    return dto;
  }
  
}
