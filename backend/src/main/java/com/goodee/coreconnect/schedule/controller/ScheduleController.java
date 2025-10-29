package com.goodee.coreconnect.schedule.controller;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.schedule.dto.request.RequestScheduleDTO;
import com.goodee.coreconnect.schedule.dto.response.ResponseScheduleDTO;
import com.goodee.coreconnect.schedule.service.ScheduleService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/schedules")
public class ScheduleController {

  private final ScheduleService scheduleService;

  /** 일정 생성 */
  @PostMapping
  public ResponseScheduleDTO create(@Valid @RequestBody RequestScheduleDTO dto, @AuthenticationPrincipal String email) {
    
    return scheduleService.createSchedule(dto, email);
  }

  /** 일정 단일 조회 */
  @GetMapping(params = "id")
  public ResponseScheduleDTO getById(@RequestParam("id") Integer id) {
      return scheduleService.getScheduleById(id);
  }

  /** 일정 수정 */
  @PutMapping("/{id}")
  public ResponseScheduleDTO update(@PathVariable("id") Integer id,
                                    @Valid @RequestBody RequestScheduleDTO dto) {
    return scheduleService.updateSchedule(id, dto);
  }

  /** 일정 삭제 (Soft Delete) */
  @DeleteMapping("/{id}")
  public void delete(@PathVariable("id") Integer id) {
    scheduleService.deleteSchedule(id);
  }

  /** 특정 유저의 일정 목록 조회 */
  @GetMapping(params = "userId")
  public List<ResponseScheduleDTO> getUserSchedules(@RequestParam("userId") Integer userId) {
    return scheduleService.getUserSchedules(userId);
  }

  /** 특정 회의실의 일정 목록 조회 */
  @GetMapping(params = "meetingRoomId")
  public List<ResponseScheduleDTO> getSchedulesByMeetingRoom(@RequestParam("meetingRoomId") Integer meetingRoomId) {
    return scheduleService.getSchedulesByMeetingRoom(meetingRoomId);
  }
}
