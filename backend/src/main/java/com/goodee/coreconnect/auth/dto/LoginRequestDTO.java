package com.goodee.coreconnect.auth.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

// 당장은 미사용 DTO입니다. 나중에 AuthController에서 사용하도록 변경 예정.

/*
 *  @JsonIgnorePropertiese(ignoreUnknown = true)
 *  Jackson이 JSON -> 객체로 변환할 때 "모르는 필드"를 무시하도록 하는 설정.
 *  스펙 불일치를 놓칠 수 있으므로 요청 DTO에만 제한적으로 사용하는 것이 좋음.
 */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record LoginRequestDTO(
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    @NotBlank(message = "이메일은 필수입니다.")
    String email,

    @NotBlank(message = "비밀번호는 필수입니다.")
    String password
) {}
