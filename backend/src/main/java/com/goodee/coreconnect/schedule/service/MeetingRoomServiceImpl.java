package com.goodee.coreconnect.schedule.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.schedule.dto.MeetingRoomDTO;
import com.goodee.coreconnect.schedule.entity.MeetingRoom;
import com.goodee.coreconnect.schedule.repository.MeetingRoomRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class MeetingRoomServiceImpl implements MeetingRoomService {

  private final MeetingRoomRepository meetingRoomRepository;

  /** 회의실 생성 */
  @Override
  public MeetingRoomDTO createMeetingRoom(MeetingRoomDTO dto) {
    MeetingRoom room = dto.toEntity();
    MeetingRoom saved = meetingRoomRepository.save(room);
    return MeetingRoomDTO.toDTO(saved);
  }

  /** 회의실 수정 (엔티티의 update() 메서드 사용) */
  @Override
  public MeetingRoomDTO updateMeetingRoom(Integer id, MeetingRoomDTO dto) {
    MeetingRoom room = meetingRoomRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("해당 회의실이 존재하지 않습니다."));

    room.update(dto.getName(),
                dto.getLocation(),
                dto.getCapacity());
    return MeetingRoomDTO.toDTO(room);
  }

  /** 회의실 삭제 (Soft Delete) */
  @Override
  public void deleteMeetingRoom(Integer id) {
    MeetingRoom room = meetingRoomRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("해당 회의실이 존재하지 않습니다."));

    room.delete(); // deletedYn = true, availableYn = false
  }
  
  /** 단일 회의실 조회 */
  @Override
  @Transactional(readOnly = true)
  public MeetingRoomDTO getMeetingRoomById(Integer id) {
    MeetingRoom room = meetingRoomRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("회의실을 찾을 수 없습니다."));
    return MeetingRoomDTO.toDTO(room);
  }

  /** 전체 회의실 목록 조회 (삭제 제외) */
  @Override
  @Transactional(readOnly = true)
  public List<MeetingRoomDTO> getAllRooms(Boolean availableOnly) {
    return meetingRoomRepository.findAll()
                                 .stream()
                                 .filter(room -> !room.getDeletedYn()) // 삭제된 회의실 제외
                                 .filter(room -> availableOnly == null || !availableOnly || room.getAvailableYn())
                                 .map(MeetingRoomDTO::toDTO)
                                 .collect(Collectors.toList());
  }
}
