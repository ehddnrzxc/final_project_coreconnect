package com.goodee.coreconnect.schedule.service;

import java.util.List;

import com.goodee.coreconnect.schedule.dto.MeetingRoomDTO;

public interface MeetingRoomService {

  MeetingRoomDTO createMeetingRoom(MeetingRoomDTO dto);

  MeetingRoomDTO updateMeetingRoom(Integer id, MeetingRoomDTO dto);

  void deleteMeetingRoom(Integer id);
  
  MeetingRoomDTO getMeetingRoomById(Integer id); 

  List<MeetingRoomDTO> getAllRooms(Boolean availableOnly);
  
}
