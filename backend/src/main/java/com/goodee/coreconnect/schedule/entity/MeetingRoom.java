package com.goodee.coreconnect.schedule.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;

@Entity
@Table(name = "meeting_room")
@Getter
public class MeetingRoom {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "mt_id")
  private Integer id;

  @Column(name = "mt_name", length = 50, nullable = false)
  private String name;

  @Column(name = "mt_location", length = 100)
  private String location;

  @Column(name = "mt_capacity")
  private Integer capacity;

  @Column(name = "mt_deleted_yn", nullable = false)
  private Boolean deletedYn;

  @Column(name = "mt_available_yn", nullable = false)
  private Boolean availableYn;
  
  /** 1:N schedule(일정) 테이블과 매핑 (양방향 관계) */
  @OneToMany(mappedBy = "meetingRoom", fetch = FetchType.LAZY)
  private List<Schedule> schedules = new ArrayList<>();

  protected MeetingRoom() {}

  public static MeetingRoom createMeetingRoom(String name,
                                               String location, 
                                               Integer capacity, 
                                               Boolean availableYn) {
    
    MeetingRoom room = new MeetingRoom();
    room.name = name;
    room.location = location;
    room.capacity = capacity;
    room.deletedYn = false;
    room.availableYn = availableYn != null ? availableYn : true;
    return room;
  }
  
  /** 회의실과 일정 양방향 관계 추가 */
  public void addSchedule(Schedule schedule) {
      if (!schedules.contains(schedule)) {
          schedules.add(schedule);
          schedule.assignMeetingRoom(this); // 역방향 연결
      }
  }
  
  /** 회의실 비활성화(삭제) */
  public void delete() {
    this.deletedYn = true;
    this.availableYn = false;
  }

  /** 회의실 복구 */
  public void restore() {
    this.deletedYn = false;
    this.availableYn = true;
  }

  /** 회의실 정보 수정 */
  public void update(String name,
                      String location, 
                      Integer capacity,
                      Boolean availableYn) {
    this.name = name;
    this.location = location;
    this.capacity = capacity;
    if (availableYn != null) this.availableYn = availableYn;
  }

  /** 회의실 이용 가능 여부 변경 */
  public void changeAvailability(boolean availableYn) {
    this.availableYn = availableYn;
  }
  
}
