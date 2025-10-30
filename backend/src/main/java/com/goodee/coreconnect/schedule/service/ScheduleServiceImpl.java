package com.goodee.coreconnect.schedule.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.department.entity.Department;
import com.goodee.coreconnect.department.repository.DepartmentRepository;
import com.goodee.coreconnect.schedule.dto.request.RequestScheduleDTO;
import com.goodee.coreconnect.schedule.dto.response.ResponseScheduleDTO;
import com.goodee.coreconnect.schedule.entity.MeetingRoom;
import com.goodee.coreconnect.schedule.entity.Schedule;
import com.goodee.coreconnect.schedule.entity.ScheduleCategory;
import com.goodee.coreconnect.schedule.repository.MeetingRoomRepository;
import com.goodee.coreconnect.schedule.repository.ScheduleCategoryRepository;
import com.goodee.coreconnect.schedule.repository.ScheduleRepository;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ScheduleServiceImpl implements ScheduleService {

  private final ScheduleRepository scheduleRepository;
  private final UserRepository userRepository;
  private final DepartmentRepository departmentRepository;
  private final MeetingRoomRepository meetingRoomRepository;
  private final ScheduleCategoryRepository categoryRepository;

  /** 일정 생성 */
  @Override
  public ResponseScheduleDTO createSchedule(RequestScheduleDTO dto, String email) {
    
    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("유저가 존재하지 않습니다."));

    Department department = (dto.getDeptId() != null)
            ? departmentRepository.findById(dto.getDeptId()).orElse(null) : null;

    MeetingRoom meetingRoom = (dto.getMeetingRoomId() != null)
            ? meetingRoomRepository.findById(dto.getMeetingRoomId()).orElse(null) : null;

    ScheduleCategory category = (dto.getCategoryId() != null)
            ? categoryRepository.findById(dto.getCategoryId()).orElse(null) : null;

    // 회의실 중복 예약 방지
    if (meetingRoom != null) {
        boolean overlap = !scheduleRepository
                .findOverlappingSchedules(meetingRoom, dto.getStartDateTime(), dto.getEndDateTime())
                .isEmpty();

        if (overlap) {
            throw new IllegalArgumentException("해당 시간대에 이미 예약된 회의실입니다.");
        }
    }

    if (meetingRoom != null) {
      boolean overlap = !scheduleRepository
              .findOverlappingSchedules(meetingRoom, dto.getStartDateTime(), dto.getEndDateTime())
              .isEmpty();
      if (overlap) {
          throw new IllegalArgumentException("해당 시간대에 이미 예약된 회의실입니다.");
      }

      // 회의실 예약 시 자동으로 비활성화 처리 (예약 중 상태)
      meetingRoom.changeAvailability(false);
    }
    
    Schedule schedule = dto.toEntity(user, department, meetingRoom, category);
    Schedule saved = scheduleRepository.save(schedule);

    return ResponseScheduleDTO.toDTO(saved);
  }

  /** 일정 수정 */
  @Override
  public ResponseScheduleDTO updateSchedule(Integer id, RequestScheduleDTO dto) {
    
    Schedule schedule = scheduleRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("해당 일정이 존재하지 않습니다."));

    Department department = (dto.getDeptId() != null)
            ? departmentRepository.findById(dto.getDeptId()).orElse(null) : null;

    MeetingRoom meetingRoom = (dto.getMeetingRoomId() != null)
            ? meetingRoomRepository.findById(dto.getMeetingRoomId()).orElse(null) : null;

    ScheduleCategory category = (dto.getCategoryId() != null)
            ? categoryRepository.findById(dto.getCategoryId()).orElse(null) : null;

    // 중복 예약 방지 (자기 자신 제외)
    if (meetingRoom != null) {
      
      boolean overlap = !scheduleRepository
              .findOverlappingSchedules(meetingRoom, dto.getStartDateTime(), dto.getEndDateTime())
              .stream()
              .filter(s -> !s.getId().equals(id))
              .toList()
              .isEmpty();

      if (overlap) {
          throw new IllegalArgumentException("해당 시간대에 이미 예약된 회의실입니다.");
      }
    }

    schedule.update(dto.getTitle(),
                    dto.getContent(),
                    dto.getLocation(),
                    dto.getStartDateTime(),
                    dto.getEndDateTime(),
                    dto.getVisibility(),
                    meetingRoom,
                    category,
                    department);

    return ResponseScheduleDTO.toDTO(schedule);
  }

  /** 일정 삭제 (Soft Delete) */
  @Override
  public void deleteSchedule(Integer id) {
  
    Schedule schedule = scheduleRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("일정을 찾을 수 없습니다."));

    // Soft Delete (참여자 포함)
    schedule.deleteWithParticipants();
  }

  /** 유저별 일정 조회 (readOnly) */
  @Override
  @Transactional(readOnly = true)
  public List<ResponseScheduleDTO> getUserSchedules(Integer userId) {
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("유저가 존재하지 않습니다."));

    return scheduleRepository.findByUserAndDeletedYnFalse(user)
            .stream()
            .map(ResponseScheduleDTO::toDTO)
            .collect(Collectors.toList());
  }

  /** 단일 일정 조회 (readOnly) */
  @Override
  @Transactional(readOnly = true)
  public ResponseScheduleDTO getScheduleById(Integer id) {
    Schedule schedule = scheduleRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("해당 일정이 존재하지 않습니다."));
    return ResponseScheduleDTO.toDTO(schedule);
  }

  /** 회의실별 일정 조회 (readOnly) */
  @Override
  @Transactional(readOnly = true)
  public List<ResponseScheduleDTO> getSchedulesByMeetingRoom(Integer meetingRoomId) {
    MeetingRoom meetingRoom = meetingRoomRepository.findById(meetingRoomId)
            .orElseThrow(() -> new IllegalArgumentException("회의실을 찾을 수 없습니다."));

    return scheduleRepository.findByMeetingRoomAndDeletedYnFalse(meetingRoom)
            .stream()
            .map(ResponseScheduleDTO::toDTO)
            .collect(Collectors.toList());
  }
  
}

