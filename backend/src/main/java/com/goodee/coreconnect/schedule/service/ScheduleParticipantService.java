package com.goodee.coreconnect.schedule.service;

import java.util.List;

import com.goodee.coreconnect.schedule.dto.request.RequestScheduleParticipantDTO;
import com.goodee.coreconnect.schedule.dto.response.ResponseScheduleParticipantDTO;

public interface ScheduleParticipantService {
  
  ResponseScheduleParticipantDTO addParticipant(RequestScheduleParticipantDTO dto);

  List<ResponseScheduleParticipantDTO> getParticipantsBySchedule(Integer scheduleId);

  List<ResponseScheduleParticipantDTO> getSchedulesByUser(Integer userId);

  void deleteParticipant(Integer id);
  
}
