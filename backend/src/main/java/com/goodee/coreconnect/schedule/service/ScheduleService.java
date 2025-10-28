package com.goodee.coreconnect.schedule.service;

import java.util.List;

import com.goodee.coreconnect.schedule.dto.request.RequestScheduleDTO;
import com.goodee.coreconnect.schedule.dto.response.ResponseScheduleDTO;

public interface ScheduleService {

  ResponseScheduleDTO createSchedule(RequestScheduleDTO dto);

  ResponseScheduleDTO updateSchedule(Integer id, RequestScheduleDTO dto);

  void deleteSchedule(Integer id);

  List<ResponseScheduleDTO> getUserSchedules(Integer userId);

  ResponseScheduleDTO getScheduleById(Integer id);

  List<ResponseScheduleDTO> getSchedulesByMeetingRoom(Integer meetingRoomId);
  
}
