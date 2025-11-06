package com.goodee.coreconnect.user.service;

import java.util.List;

import com.goodee.coreconnect.user.dto.request.PasswordResetRequestDTO;
import com.goodee.coreconnect.user.dto.response.PasswordResetResponseDTO;

public interface PasswordResetService {
  
  public void createRequest(PasswordResetRequestDTO dto);
  public List<PasswordResetResponseDTO> getRequests(String status);

}
