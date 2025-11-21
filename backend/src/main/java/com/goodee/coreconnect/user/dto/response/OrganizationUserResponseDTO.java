package com.goodee.coreconnect.user.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.goodee.coreconnect.common.service.S3Service;
import com.goodee.coreconnect.user.entity.User;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor // Service에서 생성자를 편하게 쓰기 위해 추가
@JsonInclude(JsonInclude.Include.ALWAYS) // null 값도 JSON에 포함되도록 설정
public class OrganizationUserResponseDTO {

  private Integer userId;
  private String name;
  private String deptName;
  private String positionName;
  private String email;
  private String profileImageUrl; // 프로필 이미지 URL (S3 URL)

  /**
   * User 엔티티를 DTO로 변환하는 정적 팩토리 메소드 (S3Service 포함 버전)
   */
  public static OrganizationUserResponseDTO fromEntity(User user, S3Service s3Service) {
    if (user == null) return null;

    // department(부서)가 null일 경우 "N/A" (혹은 "소속없음")
    String teamName = (user.getDepartment() != null) 
        ? user.getDepartment().getDeptName() // Department 엔티티의 deptName 필드
            : "N/A"; 

    // jobGrade(직급)가 null일 경우 "N/A"
    String positionName = (user.getJobGrade() != null) 
        ? user.getJobGrade().label()  // JobGrade Enum의 label() (예: "사원")
            : "N/A";

    // 프로필 이미지 URL 변환 (user_profile_image_key → S3 URL)
    String profileImageUrl = null; // null로 초기화하여 JSON에 명시적으로 포함되도록 함
    String profileImageKey = user.getProfileImageKey();
    
    // 디버깅: profileImageKey 확인
    log.debug("[OrganizationUserResponseDTO.fromEntity] userId: {}, name: {}, profileImageKey: {}, s3Service: {}", 
              user.getId(), user.getName(), profileImageKey, s3Service != null ? "존재" : "null");
    
    if (profileImageKey != null && !profileImageKey.isBlank() && s3Service != null) {
      try {
        profileImageUrl = s3Service.getFileUrl(profileImageKey);
        log.debug("[OrganizationUserResponseDTO.fromEntity] ✅ profileImageUrl 생성 성공 - userId: {}, name: {}, url: {}", 
                  user.getId(), user.getName(), 
                  profileImageUrl != null ? profileImageUrl.substring(0, Math.min(80, profileImageUrl.length())) + "..." : "null");
      } catch (Exception e) {
        log.error("[OrganizationUserResponseDTO.fromEntity] ❌ S3 URL 변환 실패: userId={}, name={}, profileImageKey={}, error={}", 
                  user.getId(), user.getName(), profileImageKey, e.getMessage(), e);
        profileImageUrl = null; // 예외 발생 시 null로 설정
      }
    } else {
      String reason = "";
      if (profileImageKey == null) reason = "profileImageKey가 null";
      else if (profileImageKey.isBlank()) reason = "profileImageKey가 빈 문자열";
      else if (s3Service == null) reason = "s3Service가 null";
      log.warn("[OrganizationUserResponseDTO.fromEntity] ⚠️ 프로필 이미지 URL 생성 불가 - userId: {}, name: {}, 이유: {}", 
               user.getId(), user.getName(), reason);
    }

    return new OrganizationUserResponseDTO(
        user.getId(),       // User 엔티티의 id 필드
        user.getName(),
        teamName,
        positionName,
        user.getEmail(),
        profileImageUrl     // S3 URL로 변환된 프로필 이미지 URL
        );
  }

  /**
   * User 엔티티를 DTO로 변환하는 정적 팩토리 메소드 (하위 호환성용)
   * @Deprecated S3Service를 포함한 버전 사용 권장
   */
  @Deprecated
  public static OrganizationUserResponseDTO fromEntity(User user) {
    if (user == null) return null;

    // department(부서)가 null일 경우 "N/A" (혹은 "소속없음")
    String teamName = (user.getDepartment() != null) 
        ? user.getDepartment().getDeptName()
            : "N/A"; 

    // jobGrade(직급)가 null일 경우 "N/A"
    String positionName = (user.getJobGrade() != null) 
        ? user.getJobGrade().label()
            : "N/A";

    return new OrganizationUserResponseDTO(
        user.getId(),
        user.getName(),
        teamName,
        positionName,
        user.getEmail(),
        "" // 프로필 이미지 URL 없음
        );
  }
}