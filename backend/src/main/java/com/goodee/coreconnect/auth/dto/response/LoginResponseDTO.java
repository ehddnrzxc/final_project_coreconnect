package com.goodee.coreconnect.auth.dto.response;

/**
 * 로그인 응답용 DTO
 */
public record LoginResponseDTO(
      String email,
      String name,
      String role,
      String departmentName,
      String jobGrade
    ) {}
