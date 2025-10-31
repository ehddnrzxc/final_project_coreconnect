package com.goodee.coreconnect.department.dto.response;

import java.util.List;
import java.util.stream.Collectors;

import com.goodee.coreconnect.department.entity.Department;
import com.goodee.coreconnect.user.entity.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * 부서 트리 + 구성원 목록을 함께 내려주는 DTO
 */
@Getter
@Builder
@AllArgsConstructor
public class OrganizationTreeDTO {

    private Integer deptId;
    private String deptName;
    private List<MemberDTO> members;
    private List<OrganizationTreeDTO> children;

    /** 구성원 DTO */
    @Getter
    @Builder
    @AllArgsConstructor
    public static class MemberDTO {
        private Integer userId;
        private String name;
        private String jobGrade;
        private String email;
        private String profileUrl;

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

    /** Department → DTO 변환 */
    public static OrganizationTreeDTO from(Department dept) {
        List<MemberDTO> members = dept.getUsers().stream()
                .map(MemberDTO::from)
                .collect(Collectors.toList());

        List<OrganizationTreeDTO> children = dept.getChildren().stream()
                .map(OrganizationTreeDTO::from)
                .collect(Collectors.toList());

        return OrganizationTreeDTO.builder()
                .deptId(dept.getId())
                .deptName(dept.getDeptName())
                .members(members)
                .children(children)
                .build();
    }
}
