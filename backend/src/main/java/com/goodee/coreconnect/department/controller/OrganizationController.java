package com.goodee.coreconnect.department.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.common.dto.response.ResponseDTO;
import com.goodee.coreconnect.department.dto.response.OrganizationTreeDTO;
import com.goodee.coreconnect.department.service.OrganizationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "Organization API", description = "조직도 조회 API")
@RestController
@RequestMapping("/api/v1/organ") 
@RequiredArgsConstructor // 서비스 주입 (생성자 자동 생성)
public class OrganizationController {

    private final OrganizationService organizationService; 

    @Operation(summary = "조직도 전체 조회", description = "부서 트리 구조 및 구성원 정보를 포함한 전체 조직도를 조회합니다.")
    @GetMapping
    public ResponseEntity<ResponseDTO<List<OrganizationTreeDTO>>> getOrganizationTree() {
        List<OrganizationTreeDTO> result = organizationService.getOrganizationTree(); // 서비스에서 트리 데이터 조회
        
        return ResponseEntity.ok(ResponseDTO.<List<OrganizationTreeDTO>>builder()
                                             .status(HttpStatus.OK.value())
                                             .message("조직도 조회 성공")
                                             .data(result)
                                             .build());
    }
}
