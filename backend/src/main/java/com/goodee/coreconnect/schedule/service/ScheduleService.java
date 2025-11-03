package com.goodee.coreconnect.schedule.service;

import java.util.List;

import com.goodee.coreconnect.schedule.dto.request.RequestScheduleDTO;
import com.goodee.coreconnect.schedule.dto.response.ResponseScheduleDTO;

public interface ScheduleService {

  ResponseScheduleDTO createSchedule(RequestScheduleDTO dto, String email);

  ResponseScheduleDTO updateSchedule(Integer id, RequestScheduleDTO dto);

  void deleteSchedule(Integer id);

  ResponseScheduleDTO getScheduleById(Integer id);
  
  /** 특정 유저의 일정 목록 조회 (삭제되지 않은 일정만 반환) */
  List<ResponseScheduleDTO> getUserSchedules(Integer userId);

  /** 특정 회의실의 일정 목록 조회 (삭제되지 않은 일정만 반환) */
  List<ResponseScheduleDTO> getSchedulesByMeetingRoom(Integer meetingRoomId);
  
  /** 특정 부서의 일정 목록 조회 (삭제되지 않은 일정만 반환) */
  List<ResponseScheduleDTO> getSchedulesByDepartment(Integer deptId);
  
}
