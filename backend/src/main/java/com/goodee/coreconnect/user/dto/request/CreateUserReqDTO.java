package com.goodee.coreconnect.user.dto.request;

import com.goodee.coreconnect.user.entity.JobGrade;
import com.goodee.coreconnect.user.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

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

