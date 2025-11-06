package com.goodee.coreconnect.user.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.user.dto.request.PasswordResetRequestDTO;
import com.goodee.coreconnect.user.dto.response.PasswordResetResponseDTO;
import com.goodee.coreconnect.user.service.PasswordResetService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/password-reset")
public class PasswordResetController {
  
  private final PasswordResetService passwordResetService;
  
  @GetMapping("/requests")
  public List<PasswordResetResponseDTO> getRequest(@RequestParam(required = false) String status) {
    return passwordResetService.getRequests(status);
  }

}
