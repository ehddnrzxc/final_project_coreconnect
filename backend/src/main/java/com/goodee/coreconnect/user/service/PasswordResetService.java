package com.goodee.coreconnect.user.service;

import com.goodee.coreconnect.user.dto.request.PasswordResetRequestDTO;

public interface PasswordResetService {
  
  public void createRequest(PasswordResetRequestDTO dto);

}
