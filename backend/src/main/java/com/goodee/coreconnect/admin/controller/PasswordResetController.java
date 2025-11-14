package com.goodee.coreconnect.admin.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.admin.dto.request.PasswordResetRequestDTO;
import com.goodee.coreconnect.user.service.PasswordResetService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/password-reset")
public class PasswordResetController {
  
  private final PasswordResetService passwordResetService;
  
  /** 비밀번호 변경 요청 */
  @PostMapping("/requests")
  public ResponseEntity<Void> createRequest(@Valid @RequestBody PasswordResetRequestDTO dto) {
      passwordResetService.createRequest(dto);
      return ResponseEntity.ok().build();
  }

}
