package com.goodee.coreconnect.admin.dto.request;

import com.goodee.coreconnect.user.entity.JobGrade;
import com.goodee.coreconnect.user.entity.Role;
import com.goodee.coreconnect.user.entity.Status;

/** 관리자용 사용자 정보 수정 요청 DTO */
public record UpdateUserReqDTO(
    String name,
    String phone,
    Integer deptId,
    Role role,
    Status status,
    JobGrade jobGrade
) {}
