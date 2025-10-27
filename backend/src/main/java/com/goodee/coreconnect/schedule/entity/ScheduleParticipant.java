package com.goodee.coreconnect.schedule.entity;

import java.time.LocalDateTime;

import com.goodee.coreconnect.schedule.enums.ScheduleRole;
import com.goodee.coreconnect.user.entity.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "schedule_participant")
@Getter
@Setter
public class ScheduleParticipant {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "sch_part_id")
  private Integer id;

  @Enumerated(EnumType.STRING)
  @Column(name = "sch_part_role", length = 10)
  private ScheduleRole role;  // OWNER / MEMBER

  @Column(name = "sch_part_created_at")
  private LocalDateTime createdAt;

  /**
   * N:1 (user 테이블과 매핑)
   */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id")
  private User user;

  /**
   * N:1 (schedule 테이블과 매핑)
   */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "sch_id")
  private Schedule schedule;
  
  protected ScheduleParticipant() {}

  public static ScheduleParticipant createParticipant(Schedule schedule, 
                                                        User user, 
                                                        ScheduleRole role) {
    ScheduleParticipant participant = new ScheduleParticipant();
    participant.schedule = schedule;
    participant.user = user;
    participant.role = role != null ? role : ScheduleRole.MEMBER;
    participant.createdAt = LocalDateTime.now();
    return participant;
  }
  
}
