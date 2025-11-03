package com.goodee.coreconnect.auth.dto;


//당장은 미사용 DTO입니다. 나중에 AuthController에서 사용하도록 변경 예정.

/**
 * 로그인 응답용 DTO
 */
public record LoginResponseDTO(
      String accessToken,
      String email,
      String name,
      String role
    ) {}
