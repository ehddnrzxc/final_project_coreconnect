package com.goodee.coreconnect.schedule.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.goodee.coreconnect.department.entity.Department;
import com.goodee.coreconnect.schedule.enums.ScheduleVisibility;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;

@Entity
@Table(name = "schedule")
@Getter
public class Schedule {
  
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "sch_id")
  private Integer id;

  @Column(name = "sch_title", length = 100, nullable = false)
  private String title;

  @Column(name = "sch_content", columnDefinition = "TEXT")
  private String content;

  @Column(name = "sch_start_datetime", nullable = false)
  private LocalDateTime startDateTime;

  @Column(name = "sch_end_datetime", nullable = false)
  private LocalDateTime endDateTime;

  @Column(name = "sch_location", length = 100)
  private String location;

  @Enumerated(EnumType.STRING)
  @Column(name = "sch_visibility", length = 20)
  private ScheduleVisibility visibility; // PUBLIC / PRIVATE

  @Column(name = "sch_deleted_yn", nullable = false)
  private Boolean deletedYn;

  @Column(name = "sch_created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "sch_updated_at")
  private LocalDateTime updatedAt;

  /** N:1 (user 테이블과 매핑) */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id")
  private User user;
  
  /** N:1 (scheduleCategory 테이블과 매핑) */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "sch_category_id")
  private ScheduleCategory category;
  
  /** N:1 (meetingRoom 테이블과 매핑) */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "mt_id")
  private MeetingRoom meetingRoom;
  
  /** N:1 (department 테이블과 매핑) */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "dept_id")
  private Department department;
  
  /** 1:N (scheduleParticipant(일정 참여자) 관계 추가) */
  @OneToMany(mappedBy = "schedule", fetch = FetchType.LAZY)
  private List<ScheduleParticipant> participants = new ArrayList<>();
  
  
  protected Schedule() {};
  
  public static Schedule createSchedule(User user,
                                          Department department,
                                          MeetingRoom meetingRoom,
                                          ScheduleCategory category,
                                          String title,
                                          String content,
                                          LocalDateTime start,
                                          LocalDateTime end,
                                          String location,
                                          ScheduleVisibility visibility) {
    Schedule schedule = new Schedule();
    schedule.user = user;
    schedule.department = department;
    schedule.meetingRoom = meetingRoom;
    schedule.category = category;
    schedule.title = title;
    schedule.content = content;
    schedule.startDateTime = start;
    schedule.endDateTime = end;
    schedule.location = location;
    schedule.visibility = visibility != null ? visibility : ScheduleVisibility.PRIVATE;
    schedule.deletedYn = false;
    schedule.createdAt = LocalDateTime.now();
    return schedule;
  }



  /** 일정 정보 수정 */
  public void update(String title,
                      String content,
                      String location,
                      LocalDateTime start,
                      LocalDateTime end,
                      ScheduleVisibility visibility,
                      MeetingRoom meetingRoom,
                      ScheduleCategory category,
                      Department department) {
    this.title = title;
    this.content = content;
    this.location = location;
    this.startDateTime = start;
    this.endDateTime = end;
    this.visibility = visibility;
    this.meetingRoom = meetingRoom;
    this.category = category;
    this.department = department;
    this.updatedAt = LocalDateTime.now();
  }
  
  /** Soft Delete + 참여자까지 함께 Soft Delete */
  public void deleteWithParticipants() {
    this.deletedYn = true;
    this.updatedAt = LocalDateTime.now();

    if (participants != null && !participants.isEmpty()) {
      participants.forEach(ScheduleParticipant::delete);
    }
  }
  
}
