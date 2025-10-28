package com.goodee.coreconnect.schedule.dto.request;

import com.goodee.coreconnect.schedule.entity.Schedule;
import com.goodee.coreconnect.schedule.entity.ScheduleParticipant;
import com.goodee.coreconnect.schedule.enums.ScheduleRole;
import com.goodee.coreconnect.user.entity.User;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@NoArgsConstructor
@Getter
@ToString
public class RequestScheduleParticipantDTO {

  private Integer scheduleId;
  private Integer userId;
  private ScheduleRole role;

  /** DTO → Entity 변환 */
  public ScheduleParticipant toEntity(Schedule schedule, User user) {
    
    return ScheduleParticipant.createParticipant(schedule,
                                                  user,
                                                  role != null ? role : ScheduleRole.MEMBER);
  }
  
}
