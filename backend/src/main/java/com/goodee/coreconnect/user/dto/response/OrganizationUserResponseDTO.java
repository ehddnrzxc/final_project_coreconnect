package com.goodee.coreconnect.user.dto.response;

import com.goodee.coreconnect.common.service.S3Service;
import com.goodee.coreconnect.user.entity.User;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor // Service에서 생성자를 편하게 쓰기 위해 추가
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
    String profileImageUrl = "";
    String profileImageKey = user.getProfileImageKey();
    
    // 디버깅: profileImageKey 확인
    System.out.println("[OrganizationUserResponseDTO.fromEntity] userId: " + user.getId() + 
                      ", name: " + user.getName() + 
                      ", profileImageKey: " + profileImageKey);
    
    if (profileImageKey != null && !profileImageKey.isBlank() && s3Service != null) {
      try {
        profileImageUrl = s3Service.getFileUrl(profileImageKey);
        System.out.println("[OrganizationUserResponseDTO.fromEntity] profileImageUrl 생성 성공: " + 
                          (profileImageUrl != null ? profileImageUrl.substring(0, Math.min(50, profileImageUrl.length())) + "..." : "null"));
      } catch (Exception e) {
        System.err.println("[OrganizationUserResponseDTO.fromEntity] S3 URL 변환 실패: userId=" + user.getId() + 
                         ", profileImageKey=" + profileImageKey + ", error=" + e.getMessage());
        profileImageUrl = ""; // 예외 발생 시 빈 문자열
      }
    } else {
      System.out.println("[OrganizationUserResponseDTO.fromEntity] profileImageKey가 null 또는 빈 문자열이거나 s3Service가 null");
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