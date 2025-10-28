// com/goodee/coreconnect/user/dto/response/UserDto.java
package com.goodee.coreconnect.user.dto.response;

import java.time.LocalDateTime;
import com.goodee.coreconnect.user.entity.Role;
import com.goodee.coreconnect.user.entity.Status;
import com.goodee.coreconnect.user.entity.User;

public record UserDto(
    Integer id,
    String email,
    String name,
    String phone,
    Role role,
    Status status,
    Integer deptId,
    String deptName,
    LocalDateTime joinDate
) {
    public static UserDto from(User u) {
        return new UserDto(
            u.getId(),
            u.getEmail(),
            u.getName(),
            u.getPhone(),
            u.getRole(),
            u.getStatus(),
            u.getDepartment() != null ? u.getDepartment().getId() : null,
            u.getDepartment() != null ? u.getDepartment().getDeptName() : null,
            u.getJoinDate()
        );
    }
}
