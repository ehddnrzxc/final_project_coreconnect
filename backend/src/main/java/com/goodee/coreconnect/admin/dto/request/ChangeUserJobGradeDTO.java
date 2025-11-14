package com.goodee.coreconnect.admin.dto.request;

import com.goodee.coreconnect.user.entity.JobGrade;

/** 관리자용 - 사용자 직급 변경 요청 DTO */
public record ChangeUserJobGradeDTO(JobGrade jobGrade) {}
