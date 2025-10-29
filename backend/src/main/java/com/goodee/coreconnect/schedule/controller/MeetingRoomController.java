package com.goodee.coreconnect.schedule.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.goodee.coreconnect.schedule.dto.MeetingRoomDTO;
import com.goodee.coreconnect.schedule.service.MeetingRoomService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/meetingRooms")
public class MeetingRoomController {

  private final MeetingRoomService meetingRoomService;

  /** 회의실 생성 */
  @PostMapping
  public MeetingRoomDTO create(@Valid @RequestBody MeetingRoomDTO dto) {
    return meetingRoomService.createMeetingRoom(dto);
  }

  /** 회의실 수정 */
  @PutMapping("/{id}")
  public MeetingRoomDTO update(@PathVariable Integer id,
                               @Valid @RequestBody MeetingRoomDTO dto) {
    return meetingRoomService.updateMeetingRoom(id, dto);
  }

  /** 회의실 삭제 (Soft Delete) */
  @DeleteMapping("/{id}")
  public void delete(@PathVariable Integer id) {
    meetingRoomService.deleteMeetingRoom(id);
  }
  
  /** 회의실 단일 조회 (id 파라미터 기반으로 통일) */
  @GetMapping(params = "id") 
  public MeetingRoomDTO getById(@RequestParam Integer id) { 
    return meetingRoomService.getMeetingRoomById(id);        
  }

  /** 회의실 목록 조회 */
  @GetMapping
  public List<MeetingRoomDTO> getAll(@RequestParam(required = false) Boolean availableOnly) {
    return meetingRoomService.getAllRooms(availableOnly);
  }
}

