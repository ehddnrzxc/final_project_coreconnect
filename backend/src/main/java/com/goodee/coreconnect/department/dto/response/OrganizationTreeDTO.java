package com.goodee.coreconnect.department.dto.response;

import java.util.List;
import java.util.stream.Collectors;

import com.goodee.coreconnect.department.entity.Department;
import com.goodee.coreconnect.user.entity.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * 부서와 구성원을 함께 내려주는 DTO
 * (재귀 구조를 통해 전체 조직도를 계층형으로 표현)
 */
@Getter
@Builder
@AllArgsConstructor
public class OrganizationTreeDTO {

    // 부서 기본 정보
    private Integer deptId;
    private String deptName;
    
    // 부서 구성원 목록
    private List<MemberDTO> members;
    
    // 하위 부서 목록 (재귀 구조)
    private List<OrganizationTreeDTO> children;

    /** 한 명의 구성원(User)을 표현하는 내부 DTO 클래스 */
    @Getter
    @Builder
    @AllArgsConstructor
    public static class MemberDTO {
        private Integer userId;
        private String name;
        private String jobGrade;
        private String email;
        private String profileUrl;

        /** User 엔티티 -> MemberDTO 변환 */
        public static MemberDTO from(User user) {
            return MemberDTO.builder()
                             .userId(user.getId())
                             .name(user.getName())
                             .jobGrade(user.getJobGrade() != null ? user.getJobGrade().label() : null)
                             .email(user.getEmail())
                             .profileUrl(user.getProfileImageKey())
                             .build();
        }
    }

    /** 
     * Department 엔티티 -> OrganizationTreeDTO 변환 
     * (부서 1건을 DTO로 변환하고, 그 하위 부서들도 재귀적으로 변환)
     */
    public static OrganizationTreeDTO from(Department dept) {
        // 부서 내 구성원(User 엔티티 -> MemberDTO) 변환
        List<MemberDTO> members = dept.getUsers().stream()
                                                 .map(user -> MemberDTO.from(user))
                                                 .collect(Collectors.toList());

        // 하위 부서(Department -> OrganizationTreeDTO) 변환 (재귀 구조)
        List<OrganizationTreeDTO> children = dept.getChildren().stream()
                                                               .map(child -> OrganizationTreeDTO.from(child))
                                                               .collect(Collectors.toList());
        
        // 현재 부서 정보 + 구성원 + 하위 부서 포함해 DTO 빌드
        return OrganizationTreeDTO.builder()
                                   .deptId(dept.getId())
                                   .deptName(dept.getDeptName())
                                   .members(members)
                                   .children(children)
                                   .build();
    }
}
