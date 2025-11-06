package com.goodee.coreconnect.schedule.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "Schedule API", description = "일정 관리 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/schedules")
@SecurityRequirement(name = "bearerAuth")
public class ScheduleController {

  private final ScheduleService scheduleService;

  /** 일정 생성 */
  @Operation(summary = "일정 등록", description = "새로운 일정을 등록합니다. (OWNER 및 MEMBER 중복 일정 자동 검사)")
  @PostMapping
  public ResponseEntity<ResponseScheduleDTO> create(
      @Valid @RequestBody RequestScheduleDTO dto,
      @AuthenticationPrincipal String email
  ) {
    ResponseScheduleDTO response = scheduleService.createSchedule(dto, email);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  /** 일정 수정 */
  @Operation(summary = "일정 수정", description = "기존 일정을 수정합니다. (중복 일정 자동 검사)")
  @PutMapping("/{id}")
  public ResponseEntity<ResponseScheduleDTO> update(
      @PathVariable("id") Integer id,
      @Valid @RequestBody RequestScheduleDTO dto
  ) {
    ResponseScheduleDTO response = scheduleService.updateSchedule(id, dto);
    return ResponseEntity.ok(response);
  }

  /** 일정 삭제 (Soft Delete) */
  @Operation(summary = "일정 삭제", description = "기존의 일정을 삭제합니다.")
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable("id") Integer id) {
    scheduleService.deleteSchedule(id);
    return ResponseEntity.noContent().build();
  }
  
  /** 일정 단일 조회 */
  @Operation(summary = "일정 단일 조회", description = "일정 하나를 조회합니다.")
  @GetMapping(params = "id")
  public ResponseEntity<ResponseScheduleDTO> getById(@RequestParam("id") Integer id) {
    return ResponseEntity.ok(scheduleService.getScheduleById(id));
  }
  
  /**
   * 로그인한 사용자의 일정 조회 (내 일정 보기)
   * 프론트에서 userId를 보내지 않아도 JWT 토큰의 이메일을 통해 조회 가능
   */
  @Operation(summary = "내 일정 조회", description = "현재 로그인한 사용자의 일정을 조회합니다. (OWNER + MEMBER 포함)")
  @GetMapping("/me")
  @SecurityRequirement(name = "bearerAuth")
  public ResponseEntity<List<ResponseScheduleDTO>> getMySchedules(@AuthenticationPrincipal String email) {
    return ResponseEntity.ok(scheduleService.getSchedulesByEmail(email));
  }

  /** 특정 유저의 일정 목록 조회 */
  @Operation(summary = "유저의 일정 조회", description = "특정 유저의 일정을 조회합니다. (OWNER + MEMBER 포함)")
  @GetMapping(params = "userId")
  public ResponseEntity<List<ResponseScheduleDTO>> getUserSchedules(@RequestParam("userId") Integer userId) {
    return ResponseEntity.ok(scheduleService.getUserSchedules(userId));
  }
  
  /** 로그인한 사용자의 '오늘 일정'만 조회 */
  @Operation(summary = "오늘 일정 조회", description = "로그인한 사용자의 오늘 일정을 조회합니다.")
  @GetMapping("/me/today")
  public List<ResponseScheduleDTO> getMyTodaySchedules(@AuthenticationPrincipal String email) {
      return scheduleService.getTodaySchedulesByEmail(email);
  }

  /** 특정 회의실의 일정 목록 조회 */
  @Operation(summary = "회의실 일정 조회", description = "특정 회의실의 일정을 조회합니다.")
  @GetMapping(params = "meetingRoomId")
  public ResponseEntity<List<ResponseScheduleDTO>> getSchedulesByMeetingRoom(
      @RequestParam("meetingRoomId") Integer meetingRoomId
  ) {
    return ResponseEntity.ok(scheduleService.getSchedulesByMeetingRoom(meetingRoomId));
  }
  
  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<String> handleIllegalArgument(IllegalArgumentException ex) {
    return ResponseEntity.badRequest().body(ex.getMessage());
  }
  
  
  
}
