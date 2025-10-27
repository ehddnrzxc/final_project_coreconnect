package com.goodee.coreconnect.schedule.dto.response;

import java.time.LocalDateTime;

import com.goodee.coreconnect.schedule.entity.Schedule;
import com.goodee.coreconnect.schedule.enums.ScheduleVisibility;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResponseScheduleDTO {
  
  private Integer id;
  private String title;
  private String content;
  private String location;
  private LocalDateTime startDateTime;
  private LocalDateTime endDateTime;
  private ScheduleVisibility visibility;
  private String userName;
  private String deptName;
  private String categoryName;
  private String meetingRoomName;
  private LocalDateTime createdAt;
  
  /** Entity → DTO 변환 */
  public static ResponseScheduleDTO toDTO(Schedule entity) {
    
    ResponseScheduleDTO dto = new ResponseScheduleDTO();
    dto.setId(entity.getId());
    dto.setTitle(entity.getTitle());
    dto.setContent(entity.getContent());
    dto.setLocation(entity.getLocation());
    dto.setStartDateTime(entity.getStartDateTime());
    dto.setEndDateTime(entity.getEndDateTime());
    dto.setVisibility(entity.getVisibility());
    dto.setCreatedAt(entity.getCreatedAt());

    if (entity.getUser() != null)
        dto.setUserName(entity.getUser().getName());
    if (entity.getDepartment() != null)
        dto.setDeptName(entity.getDepartment().getDeptName());
    if (entity.getCategory() != null)
        dto.setCategoryName(entity.getCategory().getName());
    if (entity.getMeetingRoom() != null)
        dto.setMeetingRoomName(entity.getMeetingRoom().getName());

    return dto;
  }
    
}
