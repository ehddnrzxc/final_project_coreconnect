package com.goodee.coreconnect.user.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.user.dto.request.PasswordResetRequestDTO;
import com.goodee.coreconnect.user.dto.response.PasswordResetResponseDTO;
import com.goodee.coreconnect.user.entity.PasswordResetRequest;
import com.goodee.coreconnect.user.entity.ResetStatus;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.PasswordResetRequestRepository;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class PasswordResetServiceImpl implements PasswordResetService {
  
  private final UserRepository userRepository;
  private final PasswordResetRequestRepository passwordResetRequestRepository;

  /** 비밀번호 변경 요청을 생성하는 메소드 */
  @Override
  public void createRequest(PasswordResetRequestDTO dto) {
    User user = userRepository.findByEmail(dto.email())
        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 이메일입니다."));

    if (!user.getName().equals(dto.name())) {
        throw new IllegalArgumentException("이름이 일치하지 않습니다.");
    }

    PasswordResetRequest req = dto.toEntity(user);
    passwordResetRequestRepository.save(req);
    
  }

  @Override
  public List<PasswordResetResponseDTO> getRequests(String status) {
    List<PasswordResetRequest> requests;
    
    if(status == null || status.isBlank()) {
      requests = passwordResetRequestRepository.findAll();
    } else {
      ResetStatus resetStatus = ResetStatus.valueOf(status.toUpperCase());
      requests = passwordResetRequestRepository.findByStatus(resetStatus);
    }
    
    return requests.stream()
                   .map(PasswordResetResponseDTO::fromEntity)
                   .collect(Collectors.toList());
  }
  
  

}
