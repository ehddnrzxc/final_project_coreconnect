package com.goodee.coreconnect.user.dto.request;

/** 비밀번호 변경 요청 DTO */
public record ChangePasswordRequestDTO(
    String currentPassword,  // 현재 비밀번호
    String newPassword,      // 새 비밀번호
    String confirmPassword    // 새 비밀번호 확인
) {}

