package com.goodee.coreconnect.schedule.controller;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.schedule.dto.request.RequestScheduleParticipantDTO;
import com.goodee.coreconnect.schedule.dto.response.ResponseScheduleParticipantDTO;
import com.goodee.coreconnect.schedule.service.ScheduleParticipantService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/scheduleParticipants")
public class ScheduleParticipantController {

  private final ScheduleParticipantService participantService;

  /** 참여자 추가 */
  @PostMapping
  public ResponseScheduleParticipantDTO add(@Valid @RequestBody RequestScheduleParticipantDTO dto, @AuthenticationPrincipal String email) {
    
    return participantService.addParticipant(dto, email);
  }

  /** 일정별 참여자 목록 조회 */
  @GetMapping(params = "scheduleId")
  public List<ResponseScheduleParticipantDTO> getBySchedule(@RequestParam("scheduleId") Integer scheduleId) {
    return participantService.getParticipantsBySchedule(scheduleId);
  }

  /** 유저별 참여 일정 목록 조회 */
  @GetMapping(params = "userId")
  public List<ResponseScheduleParticipantDTO> getByUser(@RequestParam("userId") Integer userId) {
    return participantService.getSchedulesByUser(userId);
  }

  /** 참여자 삭제 (Soft Delete) */
  @DeleteMapping("/{id}")
  public void delete(@PathVariable("id") Integer id) {
    participantService.deleteParticipant(id);
  }
}

