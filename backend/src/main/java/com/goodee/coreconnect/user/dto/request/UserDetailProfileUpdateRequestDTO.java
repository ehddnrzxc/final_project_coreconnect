package com.goodee.coreconnect.user.dto.request;

import java.time.LocalDate;

/**
 * 사용자 프로필 수정 요청 DTO
 */
public record UserDetailProfileUpdateRequestDTO(
    String companyName,      // 회사이름
    String directPhone,       // 직통전화
    String fax,              // 팩스
    String address,          // 주소
    LocalDate birthday,      // 생일
    String bio,             // 자기소개
    String externalEmail     // 외부 메일
) {
}

