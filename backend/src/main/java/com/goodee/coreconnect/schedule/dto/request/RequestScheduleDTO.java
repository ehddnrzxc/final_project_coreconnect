package com.goodee.coreconnect.schedule.dto.request;

import java.time.LocalDateTime;

import com.goodee.coreconnect.department.entity.Department;
import com.goodee.coreconnect.schedule.entity.MeetingRoom;
import com.goodee.coreconnect.schedule.entity.Schedule;
import com.goodee.coreconnect.schedule.entity.ScheduleCategory;
import com.goodee.coreconnect.schedule.enums.ScheduleVisibility;
import com.goodee.coreconnect.user.entity.User;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class RequestScheduleDTO {
  
  private Integer deptId;
  
  private Integer meetingRoomId;
  
  private Integer categoryId;
  
  @NotBlank(message = "일정 제목은 필수입니다.")
  @Size(max = 100, message = "제목은 100자 이하로 입력해주세요.")
  private String title;
  
  private String content;
  
  @NotNull
  private LocalDateTime startDateTime;
  
  @NotNull
  private LocalDateTime endDateTime;
  
  @Size(max = 100, message = "장소는 100자 이하로 입력해주세요.")
  private String location;
  
  private ScheduleVisibility visibility;

  /** DTO → Entity 변환 */
  public Schedule toEntity(User user,
                            Department department,
                            MeetingRoom meetingRoom,
                            ScheduleCategory category) {
    
    return Schedule.createSchedule(user,
                                    department,
                                    meetingRoom,
                                    category,
                                    title,
                                    content,
                                    startDateTime,
                                    endDateTime,
                                    location,
                                    visibility != null ? visibility : ScheduleVisibility.PRIVATE);
  }
    
}