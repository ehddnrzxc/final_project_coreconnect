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

import lombok.RequiredArgsConstructor;

/**
 * 조직도 조회 전용 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/organ") 
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    @GetMapping
    public ResponseEntity<ResponseDTO<List<OrganizationTreeDTO>>> getOrganizationTree() {
        List<OrganizationTreeDTO> result = organizationService.getOrganizationTree();
        return ResponseEntity.ok(ResponseDTO.<List<OrganizationTreeDTO>>builder()
                                             .status(HttpStatus.OK.value())
                                             .message("조직도 조회 성공")
                                             .data(result)
                                             .build());
    }
}
