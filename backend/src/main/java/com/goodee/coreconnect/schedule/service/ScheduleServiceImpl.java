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
import com.goodee.coreconnect.schedule.entity.ScheduleParticipant;
import com.goodee.coreconnect.schedule.enums.ScheduleRole;
import com.goodee.coreconnect.schedule.repository.MeetingRoomRepository;
import com.goodee.coreconnect.schedule.repository.ScheduleCategoryRepository;
import com.goodee.coreconnect.schedule.repository.ScheduleParticipantRepository;
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
  private final ScheduleParticipantRepository scheduleParticipantRepository;


  /** 일정 생성 */
  @Override
  public ResponseScheduleDTO createSchedule(RequestScheduleDTO dto, String email) {

    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("유저가 존재하지 않습니다."));

    Department department = (dto.getDeptId() != null)
        ? departmentRepository.findById(dto.getDeptId()).orElse(null)
        : null;

    MeetingRoom meetingRoom = (dto.getMeetingRoomId() != null)
        ? meetingRoomRepository.findById(dto.getMeetingRoomId()).orElse(null)
        : null;

    ScheduleCategory category = (dto.getCategoryId() != null)
        ? categoryRepository.findById(dto.getCategoryId()).orElse(null)
        : null;

    // 회의실 중복 예약 방지
    if (meetingRoom != null) {
      boolean overlap = !scheduleRepository
          .findOverlappingSchedules(meetingRoom, dto.getStartDateTime(), dto.getEndDateTime())
          .isEmpty();

      if (overlap) {
        throw new IllegalArgumentException("해당 시간대에 이미 예약된 회의실입니다.");
      }

      // 회의실 예약 시 자동 비활성화 (예약 중 상태)
      meetingRoom.changeAvailability(false);
    }

    // 일정 생성
    Schedule schedule = dto.toEntity(user, department, meetingRoom, category);
    Schedule savedSchedule = scheduleRepository.save(schedule);
    
    // 일정 생성자(owner) 자동 등록
    ScheduleParticipant owner = ScheduleParticipant.createParticipant(
            savedSchedule,
            user,
            ScheduleRole.OWNER
    );
    scheduleParticipantRepository.save(owner);
    
    // 추가 참여자 목록 : MEMBER 등록
    if (dto.getParticipantIds() != null && !dto.getParticipantIds().isEmpty()) {
      for (Integer participantId : dto.getParticipantIds()) {          
        // 본인(OWNER)은 제외
        if (participantId.equals(user.getId())) continue;

        User participantUser = userRepository.findById(participantId)
                .orElseThrow(() -> new IllegalArgumentException("참여자 유저를 찾을 수 없습니다. ID=" + participantId));

        ScheduleParticipant member = ScheduleParticipant.createParticipant(savedSchedule, participantUser, ScheduleRole.MEMBER);
        scheduleParticipantRepository.save(member);
      }
    }

    return ResponseScheduleDTO.toDTO(savedSchedule);
  }

  /** 일정 수정 (회의실 상태 자동 갱신 포함) */
  @Override
  public ResponseScheduleDTO updateSchedule(Integer id, RequestScheduleDTO dto) {

    Schedule schedule = scheduleRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("해당 일정이 존재하지 않습니다."));

    Department department = (dto.getDeptId() != null)
        ? departmentRepository.findById(dto.getDeptId()).orElse(null)
        : null;

    MeetingRoom newMeetingRoom = (dto.getMeetingRoomId() != null)
        ? meetingRoomRepository.findById(dto.getMeetingRoomId()).orElse(null)
        : null;

    ScheduleCategory category = (dto.getCategoryId() != null)
        ? categoryRepository.findById(dto.getCategoryId()).orElse(null)
        : null;

    // 기존 회의실 저장 (나중에 복구를 위해)
    MeetingRoom oldMeetingRoom = schedule.getMeetingRoom();

    // 중복 예약 방지 (자기 자신 제외)
    if (newMeetingRoom != null) {
      boolean overlap = !scheduleRepository
          .findOverlappingSchedules(newMeetingRoom, dto.getStartDateTime(), dto.getEndDateTime())
          .stream()
          .filter(s -> !s.getId().equals(id))
          .toList()
          .isEmpty();

      if (overlap) {
        throw new IllegalArgumentException("해당 시간대에 이미 예약된 회의실입니다.");
      }

      // 새 회의실 예약 시 비활성화 처리
      newMeetingRoom.changeAvailability(false);
    }

    // 기존 회의실과 다른 회의실로 변경된 경우 → 기존 회의실 다시 사용 가능하게
    if (oldMeetingRoom != null && newMeetingRoom != null && !oldMeetingRoom.equals(newMeetingRoom)) {
      oldMeetingRoom.changeAvailability(true);
    }

    // 일정 정보 수정
    schedule.update(
        dto.getTitle(),
        dto.getContent(),
        dto.getLocation(),
        dto.getStartDateTime(),
        dto.getEndDateTime(),
        dto.getVisibility(),
        newMeetingRoom,
        category,
        department);
    
    // 참여자 수정 로직 
    if (dto.getParticipantIds() != null) {
      List<ScheduleParticipant> existingParticipants =
              scheduleParticipantRepository.findByScheduleAndDeletedYnFalse(schedule);

      // 기존 참여자 ID 목록 추출
      List<Integer> existingIds = existingParticipants.stream()
              .map(p -> p.getUser().getId())
              .toList();

      // 요청된 ID 중 새로 추가된 사람들
      List<Integer> newIds = dto.getParticipantIds().stream()
              .filter(id2 -> !existingIds.contains(id2))
              .toList();

      // 기존엔 있었는데, 요청엔 없는 사람 → 삭제 처리
      existingParticipants.stream()
              .filter(p -> !dto.getParticipantIds().contains(p.getUser().getId()))
              .forEach(ScheduleParticipant::delete);

      // 새로 추가된 사람들 MEMBER로 등록
      for (Integer newId : newIds) {
        User newUser = userRepository.findById(newId)
                .orElseThrow(() -> new IllegalArgumentException("참여자 유저를 찾을 수 없습니다. ID=" + newId));

        // OWNER는 제외
        boolean isOwner = schedule.getUser().getId().equals(newId);
        if (!isOwner) {
          ScheduleParticipant newMember =
                  ScheduleParticipant.createParticipant(schedule, newUser, ScheduleRole.MEMBER);
          scheduleParticipantRepository.save(newMember);
        }
      }
    }

    return ResponseScheduleDTO.toDTO(schedule);
  }

  /** 일정 삭제 (Soft Delete + 회의실 해제 포함) */
  @Override
  public void deleteSchedule(Integer id) {

    Schedule schedule = scheduleRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("일정을 찾을 수 없습니다."));

    // 회의실 예약 해제 (삭제 시 다시 예약 가능 상태로 변경)
    if (schedule.getMeetingRoom() != null) {
      schedule.getMeetingRoom().changeAvailability(true);
    }

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
