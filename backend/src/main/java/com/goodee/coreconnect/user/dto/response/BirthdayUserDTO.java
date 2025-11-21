package com.goodee.coreconnect.user.dto.response;

import java.time.LocalDate;

/**
 * 생일자 정보 DTO
 */
public record BirthdayUserDTO(
    Integer userId,
    String name,
    String email,
    String deptName,
    String profileImageUrl,
    LocalDate birthday,
    String employeeNumber
) {
}

