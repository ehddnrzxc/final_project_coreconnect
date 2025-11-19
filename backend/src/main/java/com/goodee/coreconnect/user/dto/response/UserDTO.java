package com.goodee.coreconnect.user.dto.response;

import java.time.LocalDateTime;

import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.enums.JobGrade;
import com.goodee.coreconnect.user.enums.Role;
import com.goodee.coreconnect.user.enums.Status;

public record UserDTO(
    Integer id,
    String email,
    String name,
    String phone,
    Role role,
    Status status,
    Integer deptId,
    String deptName,
    LocalDateTime joinDate,
    JobGrade jobGrade,
    String profileImageKey,
    String profileImageUrl,
    String employeeNumber
) {
    /** 정적 팩토리 생성자 메서드 */
    public static UserDTO toDTO(User u) {
        return new UserDTO(
            u.getId(),
            u.getEmail(),
            u.getName(),
            u.getPhone(),
            u.getRole(),
            u.getStatus(),
            u.getDepartment() != null ? u.getDepartment().getId() : null,
            u.getDepartment() != null ? u.getDepartment().getDeptName() : null,
            u.getJoinDate(),
            u.getJobGrade() != null ? u.getJobGrade() : null,
            u.getProfileImageKey() != null ? u.getProfileImageKey() : null,
            null,
            u.getEmployeeNumber()
        );
    }
}
