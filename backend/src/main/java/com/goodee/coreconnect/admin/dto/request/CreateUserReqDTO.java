package com.goodee.coreconnect.admin.dto.request;

import com.goodee.coreconnect.user.entity.JobGrade;
import com.goodee.coreconnect.user.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** 신규 사용자 생성 요청용 DTO */
public record CreateUserReqDTO(
 @Email 
 @NotBlank 
 String email,
 
 @NotBlank 
 String name,
 
 @NotBlank 
 String tempPassword, 
 
 String phone,
 
 Integer deptId,  
 
 JobGrade jobGrade,
 
 @NotNull 
 Role role         
 
) {}

