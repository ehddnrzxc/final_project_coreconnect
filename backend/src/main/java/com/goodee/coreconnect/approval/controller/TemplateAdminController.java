package com.goodee.coreconnect.approval.controller;

import com.goodee.coreconnect.approval.dto.request.TemplateCreateRequestDTO;
import com.goodee.coreconnect.approval.dto.request.TemplateUpdateRequestDTO;
import com.goodee.coreconnect.approval.dto.response.TemplateDetailResponseDTO;
import com.goodee.coreconnect.approval.dto.response.TemplateSimpleResponseDTO;
import com.goodee.coreconnect.approval.service.TemplateAdminService; // AdminService 주입

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // ADMIN 권한 설정
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Template Admin API", description = "전자결재 양식 관리 기능 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/templates")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')") // (클래스 레벨에서 ADMIN 권한 전체 적용)
public class TemplateAdminController {

  private final TemplateAdminService templateAdminService;

  /**
   * 1. 새 양식 생성
   * [POST] /api/v1/admin/templates
   */
  @Operation(summary = "양식 생성", description = "새 결재 양식을 생성합니다.")
  @PostMapping
  public ResponseEntity<Integer> createTemplate(
      @Valid @RequestBody TemplateCreateRequestDTO requestDTO,
      @AuthenticationPrincipal String adminEmail // 현재 로그인한 관리자 이메일
      ) {
    Integer templateId = templateAdminService.createTemplate(requestDTO, adminEmail);
    return ResponseEntity.status(HttpStatus.CREATED).body(templateId);
  }

  /**
   * 2. 전체 양식 목록 조회 (활성화 + 비활성화)
   * [GET] /api/v1/admin/templates
   */
  @Operation(summary = "전체 양식 목록 조회", description = "활성화/비활성화된 모든 양식을 조회합니다.")
  @GetMapping
  public ResponseEntity<List<TemplateSimpleResponseDTO>> getAllTemplates() {
    List<TemplateSimpleResponseDTO> templates = templateAdminService.getAllTemplates();
    return ResponseEntity.ok(templates);
  }

  /**
   * 3. 양식 상세 조회 (관리자용)
   * [GET] /api/v1/admin/templates/{templateId}
   */
  @Operation(summary = "양식 상세 조회 (관리자)", description = "특정 양식 상세 조회 (관리자용)")
  @GetMapping("/{templateId}")
  public ResponseEntity<TemplateDetailResponseDTO> getTemplateDetail(
      @PathVariable("templateId") Integer templateId
      ) {
    TemplateDetailResponseDTO templateDetail = templateAdminService.getTemplateDetail(templateId);
    return ResponseEntity.ok(templateDetail);
  }

  /**
   * 4. 양식 수정
   * [PUT] /api/v1/admin/templates/{templateId}
   */
  @Operation(summary = "양식 수정", description = "기존 양식의 내용을 수정합니다.")
  @PutMapping("/{templateId}")
  public ResponseEntity<String> updateTemplate(
      @PathVariable("templateId") Integer templateId,
      @Valid @RequestBody TemplateUpdateRequestDTO requestDTO
      ) {
    templateAdminService.updateTemplate(templateId, requestDTO);
    return ResponseEntity.ok("양식이 성공적으로 수정되었습니다.");
  }

  /**
   * 5. 양식 비활성화 (삭제 대신 권장)
   * [PATCH] /api/v1/admin/templates/{templateId}/deactivate
   */
  @Operation(summary = "양식 비활성화", description = "양식을 사용 중지 상태로 변경합니다.")
  @PatchMapping("/{templateId}/deactivate")
  public ResponseEntity<String> deactivateTemplate(
      @PathVariable("templateId") Integer templateId
      ) {
    templateAdminService.deactivateTemplate(templateId);
    return ResponseEntity.ok("양식이 비활성화되었습니다.");
  }

  /**
   * 6. 양식 활성화
   * [PATCH] /api/v1/admin/templates/{templateId}/activate
   */
  @Operation(summary = "양식 활성화", description = "비활성화된 양식을 다시 사용 상태로 변경합니다.")
  @PatchMapping("/{templateId}/activate")
  public ResponseEntity<String> activateTemplate(
      @PathVariable("templateId") Integer templateId
      ) {
    templateAdminService.activateTemplate(templateId);
    return ResponseEntity.ok("양식이 활성화되었습니다.");
  }
}