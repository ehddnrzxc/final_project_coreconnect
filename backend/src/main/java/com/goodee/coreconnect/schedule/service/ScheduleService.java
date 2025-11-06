package com.goodee.coreconnect.schedule.service;

import java.util.List;

import com.goodee.coreconnect.schedule.dto.request.RequestScheduleDTO;
import com.goodee.coreconnect.schedule.dto.response.ResponseScheduleDTO;

public interface ScheduleService {

  ResponseScheduleDTO createSchedule(RequestScheduleDTO dto, String email);

  ResponseScheduleDTO updateSchedule(Integer id, RequestScheduleDTO dto);

  void deleteSchedule(Integer id);

  ResponseScheduleDTO getScheduleById(Integer id);
  
  /** 로그인한 사용자의 이메일 기준으로 일정 조회 */
  List<ResponseScheduleDTO> getSchedulesByEmail(String email);
  
  /** 특정 유저의 일정 목록 조회 (삭제되지 않은 일정만 반환) */
  List<ResponseScheduleDTO> getUserSchedules(Integer userId);
  
  /** 로그인한 사용자의 '오늘 일정' 조회 */
  List<ResponseScheduleDTO> getTodaySchedulesByEmail(String email);

  /** 특정 회의실의 일정 목록 조회 (삭제되지 않은 일정만 반환) */
  List<ResponseScheduleDTO> getSchedulesByMeetingRoom(Integer meetingRoomId);
  
  
}
