package com.goodee.coreconnect.user.dto.response;

import java.time.LocalDate;

import com.goodee.coreconnect.user.entity.UserDetailProfile;

/**
 * 사용자 프로필 정보 DTO
 */
public record UserDetailProfileDTO(
    String companyName,      // 회사이름
    String directPhone,       // 직통전화
    String fax,              // 팩스
    String address,          // 주소
    LocalDate birthday,      // 생일
    String bio,             // 자기소개
    String externalEmail     // 외부 메일
) {
    /**
     * Entity -> DTO 변환
     */
    public static UserDetailProfileDTO toDTO(UserDetailProfile profile) {
        if (profile == null) {
            return new UserDetailProfileDTO(null, null, null, null, null, null, null);
        }
        return new UserDetailProfileDTO(
            profile.getCompanyName(),
            profile.getDirectPhone(),
            profile.getFax(),
            profile.getAddress(),
            profile.getBirthday(),
            profile.getBio(),
            profile.getExternalEmail()
        );
    }
}

