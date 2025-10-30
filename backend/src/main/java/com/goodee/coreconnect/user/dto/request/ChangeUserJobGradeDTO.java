package com.goodee.coreconnect.user.dto.request;

import com.goodee.coreconnect.user.entity.JobGrade;

/**
 * 사용자의 직급을 변경하기 위한 요청 DTO
 */
public record ChangeUserJobGradeDTO(JobGrade jobGrade) {

}
