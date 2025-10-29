package com.goodee.coreconnect.schedule.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.schedule.dto.request.RequestScheduleParticipantDTO;
import com.goodee.coreconnect.schedule.dto.response.ResponseScheduleParticipantDTO;
import com.goodee.coreconnect.schedule.entity.Schedule;
import com.goodee.coreconnect.schedule.entity.ScheduleParticipant;
import com.goodee.coreconnect.schedule.repository.ScheduleParticipantRepository;
import com.goodee.coreconnect.schedule.repository.ScheduleRepository;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ScheduleParticipantServiceImpl implements ScheduleParticipantService {

  private final ScheduleParticipantRepository participantRepository;
  private final ScheduleRepository scheduleRepository;
  private final UserRepository userRepository;

  /** 참여자 추가 */
  @Override
  public ResponseScheduleParticipantDTO addParticipant(RequestScheduleParticipantDTO dto, String email) {

    // 1️ 요청자 (로그인 유저)
    User requester = userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("요청자(로그인 유저)를 찾을 수 없습니다."));
  
    // 2️ 실제 추가할 유저 (DTO의 userId)
    User targetUser = userRepository.findById(dto.getUserId())
        .orElseThrow(() -> new IllegalArgumentException("추가할 유저를 찾을 수 없습니다."));
  
    // 3️ 일정 조회
    Schedule schedule = scheduleRepository.findById(dto.getScheduleId())
        .orElseThrow(() -> new IllegalArgumentException("일정을 찾을 수 없습니다."));
  
    // (선택사항) 권한 검사: 요청자가 일정의 OWNER인지 확인
    // boolean isOwner = participantRepository.existsByScheduleAndUserAndRole(schedule, requester, ScheduleRole.OWNER);
    // if (!isOwner) throw new SecurityException("다른 참여자를 추가할 권한이 없습니다.");
  
    // 4️ 중복 체크
    boolean alreadyExists = participantRepository.findByScheduleAndDeletedYnFalse(schedule)
        .stream()
        .anyMatch(p -> p.getUser().equals(targetUser));
    if (alreadyExists) {
      throw new IllegalStateException("이미 해당 일정에 등록된 사용자입니다.");
    }
  
    ScheduleParticipant participant = dto.toEntity(schedule, targetUser);
  
    ScheduleParticipant saved = participantRepository.save(participant);
  
    return ResponseScheduleParticipantDTO.toDTO(saved);
  }

  /** 일정별 참여자 목록 (삭제 제외) */
  @Override
  @Transactional(readOnly = true)
  public List<ResponseScheduleParticipantDTO> getParticipantsBySchedule(Integer scheduleId) {
    Schedule schedule = scheduleRepository.findById(scheduleId)
            .orElseThrow(() -> new IllegalArgumentException("일정을 찾을 수 없습니다."));

    return participantRepository.findByScheduleAndDeletedYnFalse(schedule)
                                 .stream()
                                 .map(ResponseScheduleParticipantDTO::toDTO)
                                 .collect(Collectors.toList());
  }

  /** 유저별 참여 일정 목록 (삭제 제외) */
  @Override
  @Transactional(readOnly = true)
  public List<ResponseScheduleParticipantDTO> getSchedulesByUser(Integer userId) {
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

    return participantRepository.findByUserAndDeletedYnFalse(user)
                                 .stream()
                                 .map(ResponseScheduleParticipantDTO::toDTO)
                                 .collect(Collectors.toList());
  }

  /** Soft Delete 적용 */
  @Override
  public void deleteParticipant(Integer id) {
    ScheduleParticipant participant = participantRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("참여자를 찾을 수 없습니다."));

    participant.delete(); 
  }
}