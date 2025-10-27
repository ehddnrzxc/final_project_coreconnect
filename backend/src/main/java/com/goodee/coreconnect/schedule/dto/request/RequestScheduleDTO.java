package com.goodee.coreconnect.schedule.dto.request;

import java.time.LocalDateTime;

import com.goodee.coreconnect.department.entity.Department;
import com.goodee.coreconnect.schedule.entity.MeetingRoom;
import com.goodee.coreconnect.schedule.entity.Schedule;
import com.goodee.coreconnect.schedule.entity.ScheduleCategory;
import com.goodee.coreconnect.schedule.enums.ScheduleVisibility;
import com.goodee.coreconnect.user.entity.User;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RequestScheduleDTO {
    private Integer userId;
    private Integer deptId;
    private Integer meetingRoomId;
    private Integer categoryId;
    private String title;
    private String content;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
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