package com.goodee.coreconnect.schedule.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
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
  @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
  private LocalDateTime startDateTime;

  @Column(name = "sch_end_datetime", nullable = false)
  @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
  private LocalDateTime endDateTime;

  @Column(name = "sch_location", length = 100)
  private String location;

  @Enumerated(EnumType.STRING)
  @Column(name = "sch_visibility", length = 20)
  private ScheduleVisibility visibility; // PUBLIC / PRIVATE

  @Column(name = "sch_deleted_yn", nullable = false)
  private Boolean deletedYn;

  @Column(name = "sch_created_at", nullable = false)
  @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
  private LocalDateTime createdAt;

  @Column(name = "sch_updated_at")
  @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
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
  
  
  /** 1:N (scheduleParticipant(일정 참여자) 관계 추가) */
  @OneToMany(mappedBy = "schedule", fetch = FetchType.LAZY)
  private List<ScheduleParticipant> participants = new ArrayList<>();
  
  
  protected Schedule() {};
  
  public static Schedule createSchedule(User user,
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
    
    // 회의실 지정 (양방향 관계 자동 연결)
    if (meetingRoom != null) {
        schedule.assignMeetingRoom(meetingRoom);
    }
    
    return schedule;
  }

  
  /** 회의실과 일정의 양방향 관계 설정 메서드 */
  public void assignMeetingRoom(MeetingRoom meetingRoom) {
      this.meetingRoom = meetingRoom;

      // meetingRoom 쪽에서도 해당 일정이 목록에 없으면 추가
      if (meetingRoom != null && !meetingRoom.getSchedules().contains(this)) {
          meetingRoom.getSchedules().add(this);
      }
  }
  
  /** 일정에 참여자 추가 */
  public void addParticipant(ScheduleParticipant participant) {
      if (!participants.contains(participant)) {
          participants.add(participant);
          participant.assignSchedule(this);
      }
  }

  /** 일정 정보 수정 */
  public void update(String title,
                      String content,
                      String location,
                      LocalDateTime start,
                      LocalDateTime end,
                      ScheduleVisibility visibility,
                      MeetingRoom meetingRoom,
                      ScheduleCategory category) {
    this.title = title;
    this.content = content;
    this.location = location;
    this.startDateTime = start;
    this.endDateTime = end;
    this.visibility = visibility;
    this.meetingRoom = meetingRoom;
    this.category = category;
    
    // 회의실 수정 시에도 관계 동기화
    if (meetingRoom != null) {
        assignMeetingRoom(meetingRoom);
    }
    
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
