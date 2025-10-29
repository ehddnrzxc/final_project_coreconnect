package com.goodee.coreconnect.auth.dto;

/**
 * 로그인 응답용 DTO
 */
public record LoginResponseDTO(
      String accessToken,
      String email,
      String name,
      String role
    ) {}
