package com.goodee.coreconnect.department.dto.response;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.goodee.coreconnect.department.entity.Department;
import com.goodee.coreconnect.user.entity.JobGrade;
import com.goodee.coreconnect.user.entity.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * 부서 + 구성원을 계층 구조로 내려주는 DTO
 */
@Getter
@Builder
@AllArgsConstructor
public class OrganizationTreeDTO {

    /** S3 URL 구성용 (정적 주입) */
    private static String BUCKET;
    private static String REGION;

    /** Spring이 자동으로 값을 주입해주는 setter (정적 저장) */
    @Component
    public static class AwsConfigSetter {
        @Autowired
        public AwsConfigSetter(
                @Value("${cloud.aws.s3.bucket}") String bucket,
                @Value("${cloud.aws.region.static}") String region
        ) {
            OrganizationTreeDTO.BUCKET = bucket;
            OrganizationTreeDTO.REGION = region;
        }
    }

    private Integer deptId;
    private String deptName;
    private List<MemberDTO> members;
    private List<OrganizationTreeDTO> children;

    /**
     * 구성원 DTO
     */
    @Getter
    @Builder
    @AllArgsConstructor
    public static class MemberDTO {
        private Integer userId;
        private String name;
        private String jobGrade;
        private String email;
        private String profileUrl; // S3 전체 URL
        private String phone;
        private String deptPath;
        private String deptName;

        /** User → MemberDTO 변환 */
        public static MemberDTO from(User user) {

            // 부서 경로(deptPath) 생성
            String deptPath = null;
            if (user.getDepartment() != null) {
                Department d = user.getDepartment();
                StringBuilder sb = new StringBuilder();

                while (d != null) {
                    if (sb.length() == 0) sb.insert(0, d.getDeptName());
                    else sb.insert(0, d.getDeptName() + " > ");
                    d = d.getParent();
                }
                deptPath = sb.toString();
            }

            // 프로필 S3 URL 만들기
            String profileUrl = null;
            if (user.getProfileImageKey() != null) {
                profileUrl = String.format(
                        "https://%s.s3.%s.amazonaws.com/%s",
                        BUCKET,
                        REGION,
                        user.getProfileImageKey()
                );
            }

            return MemberDTO.builder()
                    .userId(user.getId())
                    .name(user.getName())
                    .jobGrade(user.getJobGrade() != null ? user.getJobGrade().label() : null)
                    .email(user.getEmail())
                    .profileUrl(profileUrl)
                    .phone(user.getPhone())
                    .deptPath(deptPath)
                    .deptName(user.getDepartment() != null ? user.getDepartment().getDeptName() : null)
                    .build();
        }
    }

    /**
     * 직급 정렬 우선순위 (커스터마이징)
     */
    private static int gradeOrder(JobGrade grade) {
        if (grade == null) return 999; // 직급 없는 경우 맨 아래

        return switch (grade) {
            case PRESIDENT -> 1;
            case VICE_PRESIDENT -> 2;
            case EXECUTIVE_DIRECTOR -> 3;
            case DIRECTOR -> 4;
            case GENERAL_MANAGER -> 5;
            case DEPUTY_GENERAL_MANAGER -> 6;
            case MANAGER -> 7;
            case ASSISTANT_MANAGER -> 8;
            case STAFF -> 9;
            case INTERN -> 10;
        };
    }

    /**
     * Department → OrganizationTreeDTO 변환
     */
    public static OrganizationTreeDTO from(Department dept) {

        //  구성원 직급순 + 이름순 정렬
        List<MemberDTO> members = dept.getUsers().stream()
                .sorted(Comparator
                        .comparing((User u) -> gradeOrder(u.getJobGrade()))
                        .thenComparing(User::getName)
                )
                .map(MemberDTO::from)
                .collect(Collectors.toList());

        //  하위 부서 재귀 변환
        List<OrganizationTreeDTO> children = dept.getChildren().stream()
                .map(OrganizationTreeDTO::from)
                .collect(Collectors.toList());

        //  최종 DTO 생성
        return OrganizationTreeDTO.builder()
                .deptId(dept.getId())
                .deptName(dept.getDeptName())
                .members(members)
                .children(children)
                .build();
    }
}
