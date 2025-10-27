package com.goodee.coreconnect.schedule.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "meeting_room")
@Getter
@Setter
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

  @Column(name = "mt_deleted_yn")
  private Boolean deletedYn;

  @Column(name = "mt_available_yn")
  private Boolean availableYn;

  protected MeetingRoom() {}

  public static MeetingRoom createMeetingRoom(String name, 
                                                String location, 
                                                Integer capacity) {
    MeetingRoom room = new MeetingRoom();
    room.name = name;
    room.location = location;
    room.capacity = capacity;
    room.deletedYn = false;
    room.availableYn = true;
    return room;
  }
  
}
