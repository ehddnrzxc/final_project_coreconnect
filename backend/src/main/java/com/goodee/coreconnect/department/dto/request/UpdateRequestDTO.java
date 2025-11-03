package com.goodee.coreconnect.department.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 부서 수정 요청용 DTO
 */
public record UpdateRequestDTO(
    
    @NotBlank(message = "부서 이름은 비워둘 수 없습니다.")
    String name, 
    
    @NotNull(message = "정렬 순서를 입력해야 합니다.")
    Integer OrderNo) {}
