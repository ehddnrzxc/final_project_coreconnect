package com.goodee.coreconnect.user.dto.response;

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

  /**
   * User 엔티티를 DTO로 변환하는 정적 팩토리 메소드
   */
  public static OrganizationUserResponseDTO fromEntity(User user) {

    // department(부서)가 null일 경우 "N/A" (혹은 "소속없음")
    String teamName = (user.getDepartment() != null) 
        ? user.getDepartment().getDeptName() // Department 엔티티의 deptName 필드
            : "N/A"; 

    // jobGrade(직급)가 null일 경우 "N/A"
    String positionName = (user.getJobGrade() != null) 
        ? user.getJobGrade().label()  // JobGrade Enum의 label() (예: "사원")
            : "N/A";

    return new OrganizationUserResponseDTO(
        user.getId(),       // User 엔티티의 id 필드
        user.getName(),
        teamName,
        positionName,
        user.getEmail()
        );
  }
}