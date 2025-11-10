package com.goodee.coreconnect.schedule.dto.response;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.goodee.coreconnect.schedule.entity.Schedule;
import com.goodee.coreconnect.schedule.enums.ScheduleVisibility;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@NoArgsConstructor
@Getter
@ToString
public class ResponseScheduleDTO {
  
  private Integer id;
  
  private String title;
  
  private String content;
  
  private String location;

  @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
  private LocalDateTime startDateTime;
  
  @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
  private LocalDateTime endDateTime;
  
  private ScheduleVisibility visibility;
  
  private Integer userId;
  
  private String userEmail;
  
  private String userName;
  
  private String categoryName;
  
  private String meetingRoomName;
  
  @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
  private LocalDateTime createdAt;
  
  /** Entity → DTO 변환 */
  public static ResponseScheduleDTO toDTO(Schedule entity) {
    ResponseScheduleDTO dto = new ResponseScheduleDTO();
    dto.id = entity.getId();
    dto.title = entity.getTitle();
    dto.content = entity.getContent();
    dto.location = entity.getLocation();
    dto.startDateTime = entity.getStartDateTime();
    dto.endDateTime = entity.getEndDateTime();
    dto.visibility = entity.getVisibility();
    dto.userId = entity.getUser().getId();
    dto.userEmail = entity.getUser().getEmail();
    dto.createdAt = entity.getCreatedAt();

    if (entity.getUser() != null)
      dto.userName = entity.getUser().getName();
    if (entity.getCategory() != null)
      dto.categoryName = entity.getCategory().getName();
    if (entity.getMeetingRoom() != null)
      dto.meetingRoomName = entity.getMeetingRoom().getName();

    return dto;
  }
    
}
