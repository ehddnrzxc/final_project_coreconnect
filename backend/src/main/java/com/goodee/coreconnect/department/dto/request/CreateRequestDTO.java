package com.goodee.coreconnect.department.dto.request;

/**
 * 부서 생성 요청 전달용 DTO
 */
public record CreateRequestDTO(String name,
                               Integer orderNo,
                               Integer parentId) {}
