package com.goodee.coreconnect.schedule.dto.response;

import java.time.LocalDateTime;

import com.goodee.coreconnect.schedule.entity.ScheduleParticipant;
import com.goodee.coreconnect.schedule.enums.ScheduleRole;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResponseScheduleParticipantDTO {

  private Integer id;
  private Integer scheduleId;
  private String scheduleTitle;
  private Integer userId;
  private String userName;
  private ScheduleRole role;
  private LocalDateTime createdAt;

  /** Entity → DTO 변환 */
  public static ResponseScheduleParticipantDTO toDTO(ScheduleParticipant entity) {
      ResponseScheduleParticipantDTO dto = new ResponseScheduleParticipantDTO();
      dto.setId(entity.getId());
      if (entity.getSchedule() != null) {
          dto.setScheduleId(entity.getSchedule().getId());
          dto.setScheduleTitle(entity.getSchedule().getTitle());
      }
      if (entity.getUser() != null) {
          dto.setUserId(entity.getUser().getId());
          dto.setUserName(entity.getUser().getName());
      }
      dto.setRole(entity.getRole());
      dto.setCreatedAt(entity.getCreatedAt());
      return dto;
  }
  
}
