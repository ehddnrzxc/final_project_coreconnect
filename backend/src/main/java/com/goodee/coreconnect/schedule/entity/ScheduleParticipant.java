package com.goodee.coreconnect.schedule.entity;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
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

@Entity
@Table(name = "schedule_participant")
@Getter
public class ScheduleParticipant {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "sch_part_id")
  private Integer id;

  @Enumerated(EnumType.STRING)
  @Column(name = "sch_part_role", length = 10)
  private ScheduleRole role;  // OWNER / MEMBER

  @Column(name = "sch_part_created_at", nullable = false)
  @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
  private LocalDateTime createdAt;
  
  @Column(name = "sch_part_updated_at")
  @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
  private LocalDateTime updatedAt;

  @Column(name = "sch_part_deleted_yn", nullable = false)
  private Boolean deletedYn = false;

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

  /** 일정과의 양방향 관계를 설정 */
  public void assignSchedule(Schedule schedule) {
      this.schedule = schedule;
      if (schedule != null && !schedule.getParticipants().contains(this)) {
          schedule.getParticipants().add(this);
      }
  }

  /** 생성 메서드 */
  public static ScheduleParticipant createParticipant(Schedule schedule, 
                                                        User user, 
                                                        ScheduleRole role) {
    ScheduleParticipant participant = new ScheduleParticipant();
    participant.schedule = schedule;
    participant.user = user;
    participant.role = role != null ? role : ScheduleRole.MEMBER;
    participant.deletedYn = false;
    participant.createdAt = LocalDateTime.now();
    
    // Schedule과 자동 연결
    participant.assignSchedule(schedule);
    
    return participant;
  }
  
  
  /** Soft Delete 처리 */
  public void delete() {
    this.deletedYn = true;
    this.updatedAt = LocalDateTime.now();
  }
  
}
