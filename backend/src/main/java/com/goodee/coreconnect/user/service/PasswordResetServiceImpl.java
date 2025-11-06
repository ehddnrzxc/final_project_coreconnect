package com.goodee.coreconnect.user.service;

import org.springframework.stereotype.Service;

import com.goodee.coreconnect.user.dto.request.PasswordResetRequestDTO;
import com.goodee.coreconnect.user.entity.PasswordResetRequest;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PasswordResetServiceImpl implements PasswordResetService {
  
  private final UserRepository userRepository;

  /** 비밀번호 변경 요청을 생성하는 메소드 */
  @Override
  public void createRequest(PasswordResetRequestDTO dto) {
    User user = userRepository.findByEmail(dto.email())
        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 이메일입니다."));

    if (!user.getName().equals(dto.name())) {
        throw new IllegalArgumentException("이름이 일치하지 않습니다.");
    }

    PasswordResetRequest req = dto.toEntity(user);
    
  }

}
