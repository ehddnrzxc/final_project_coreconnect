package com.goodee.coreconnect.admin.dto.request;

import com.goodee.coreconnect.user.entity.PasswordResetRequest;
import com.goodee.coreconnect.user.entity.User;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordResetRequestDTO(
    @Email(message = "유효한 이메일 형식이어야 합니다.")
    @NotBlank(message = "이메일은 필수입니다.")
    String email,
    
    @NotBlank(message = "이름은 필수입니다.")
    @Size(max = 50, message = "이름은 50자 이내로 입력해주세요.")
    String name,
    
    @Size(max = 200, message = "사유는 200자 이내로 입력해주세요.")
    String reason
) {
  public PasswordResetRequest toEntity(User user) {
    return PasswordResetRequest.createPasswordResetRequest(user, reason);
  }
}
