package com.goodee.coreconnect.schedule.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.schedule.dto.MeetingRoomDTO;
import com.goodee.coreconnect.schedule.service.MeetingRoomService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "MeetingRoom API", description = "회의실 관리 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/meetingRooms")
@SecurityRequirement(name = "bearerAuth")
public class MeetingRoomController {

  private final MeetingRoomService meetingRoomService;

  /** 회의실 생성 */
  @Operation(summary = "회의실 생성", description = "새로운 회의실을 생성합니다.")
  @PostMapping
  public MeetingRoomDTO create(@Valid @RequestBody MeetingRoomDTO dto) {
    return meetingRoomService.createMeetingRoom(dto);
  }

  /** 회의실 수정 */
  @Operation(summary = "회의실 수정", description = "기존 회의실을 수정합니다.")
  @PutMapping("/{id}")
  public MeetingRoomDTO update(@PathVariable("id") Integer id,
                               @Valid @RequestBody MeetingRoomDTO dto) {
    return meetingRoomService.updateMeetingRoom(id, dto);
  }

  /** 회의실 삭제 (Soft Delete) */
  @Operation(summary = "회의실 삭제", description = "기존 회의실을 삭제합니다.")
  @DeleteMapping("/{id}")
  public void delete(@PathVariable("id") Integer id) {
    meetingRoomService.deleteMeetingRoom(id);
  }
  
  /** 회의실 단일 조회 (id 파라미터 기반으로 통일) */
  @Operation(summary = "회의실 조회", description = "회의실의 정보를 조회합니다.")
  @GetMapping(params = "id") 
  public MeetingRoomDTO getById(@RequestParam("id") Integer id) { 
    return meetingRoomService.getMeetingRoomById(id);        
  }

  /** 회의실 목록 조회 */
  @Operation(summary = "회의실 목록", description = "회의실의 목록을 조회합니다.")
  @GetMapping
  public List<MeetingRoomDTO> getAll(@RequestParam(required = false) Boolean availableOnly) {
    return meetingRoomService.getAllRooms(availableOnly);
  }
}

