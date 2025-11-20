package com.goodee.coreconnect.admin.dto.request;

import com.goodee.coreconnect.user.enums.JobGrade;
import com.goodee.coreconnect.user.enums.Role;
import com.goodee.coreconnect.user.enums.Status;

/** 관리자용 사용자 정보 수정 요청 DTO */
public record UpdateUserReqDTO(
    String name,
    String email,
    String phone,
    Integer deptId,
    Role role,
    Status status,
    JobGrade jobGrade
) {}
