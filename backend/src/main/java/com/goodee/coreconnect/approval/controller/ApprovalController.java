package com.goodee.coreconnect.approval.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.approval.dto.request.ApprovalProcessRequestDTO;
import com.goodee.coreconnect.approval.dto.request.DocumentCreateRequestDTO;
import com.goodee.coreconnect.approval.dto.response.DocumentDetailResponseDTO;
import com.goodee.coreconnect.approval.dto.response.DocumentSimpleResponseDTO;
import com.goodee.coreconnect.approval.dto.response.TemplateDetailResponseDTO;
import com.goodee.coreconnect.approval.dto.response.TemplateSimpleResponseDTO;
import com.goodee.coreconnect.approval.service.ApprovalService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/approvals") // API 기본 경로
public class ApprovalController {

    private final ApprovalService approvalService;

    /**
     * 1. 새 결재 문서 상신 (파일 첨부 포함)
     * [POST] /api/v1/approvals
     * - Content-Type: multipart/form-data
     */
    @PostMapping
    public ResponseEntity<Integer> createDocument(
        @Valid @RequestPart("dto") DocumentCreateRequestDTO requestDTO, // (1) JSON 데이터
        @RequestPart(value = "files", required = false) List<MultipartFile> files, // (2) 파일 데이터 (없을 수도 있음)
        @AuthenticationPrincipal String email // (3) 인증된 사용자 이메일
    ) {
        
        // 서비스 호출 시 email을 그대로 넘겨줍니다.
        Integer documentId = approvalService.createDocument(requestDTO, files, email);
        
        // 생성 성공 시 201 Created 상태와 문서 ID 반환
        return ResponseEntity.status(HttpStatus.CREATED).body(documentId);
    }

    /**
     * 2. 내 상신함 (내가 작성한 문서) 목록 조회
     * [GET] /api/v1/approvals/my-drafts
     */
    @GetMapping("/my-drafts")
    public ResponseEntity<List<DocumentSimpleResponseDTO>> getMyDrafts(
        @AuthenticationPrincipal String email
    ) {
        List<DocumentSimpleResponseDTO> myDrafts = approvalService.getMyDrafts(email);
        return ResponseEntity.ok(myDrafts);
    }

    /**
     * 3. 내 결재함 (내가 결재할 문서) 목록 조회
     * [GET] /api/v1/approvals/my-tasks
     */
    @GetMapping("/my-tasks")
    public ResponseEntity<List<DocumentSimpleResponseDTO>> getMyTasks(
        @AuthenticationPrincipal String email
    ) {
        List<DocumentSimpleResponseDTO> myTasks = approvalService.getMyTasks(email);
        return ResponseEntity.ok(myTasks);
    }

    /**
     * 4. 문서 상세 조회
     * [GET] /api/v1/approvals/{documentId}
     */
    @GetMapping("/{documentId}")
    public ResponseEntity<DocumentDetailResponseDTO> getDocumentDetail(
        @PathVariable("documentId") Integer documentId,
        @AuthenticationPrincipal String email
    ) {
        DocumentDetailResponseDTO documentDetail = approvalService.getDocumentDetail(documentId, email);
        return ResponseEntity.ok(documentDetail);
    }

    /**
     * 5. 문서 승인
     * [POST] /api/v1/approvals/{documentId}/approve
     */
    @PostMapping("/{documentId}/approve")
    public ResponseEntity<String> approveDocument(
        @PathVariable("documentId") Integer documentId,
        @RequestBody ApprovalProcessRequestDTO requestDTO, // 결재 의견
        @AuthenticationPrincipal String email
    ) {
        approvalService.approveDocument(documentId, requestDTO, email);
        return ResponseEntity.ok("결재가 승인되었습니다.");
    }

    /**
     * 6. 문서 반려
     * [POST] /api/v1/approvals/{documentId}/reject
     */
    @PostMapping("/{documentId}/reject")
    public ResponseEntity<String> rejectDocument(
        @PathVariable("documentId") Integer documentId,
        @Valid @RequestBody ApprovalProcessRequestDTO requestDTO, // 반려 사유
        @AuthenticationPrincipal String email
    ) {
        approvalService.rejectDocument(documentId, requestDTO, email);
        return ResponseEntity.ok("결재가 반려되었습니다.");
    }

    /**
     * 7. 활성화된 양식(템플릿) 목록 조회
     * [GET] /api/v1/approvals/templates
     */
    @GetMapping("/templates")
    public ResponseEntity<List<TemplateSimpleResponseDTO>> getActiveTemplates() {
        List<TemplateSimpleResponseDTO> templates = approvalService.getActiveTemplates();
        return ResponseEntity.ok(templates);
    }

    /**
     * 8. 특정 양식(템플릿) 상세 조회
     * [GET] /api/v1/approvals/templates/{templateId}
     */
    @GetMapping("/templates/{templateId}")
    public ResponseEntity<TemplateDetailResponseDTO> getTemplateDetail(
        @PathVariable("templateId") Integer templateId
    ) {
        TemplateDetailResponseDTO templateDetail = approvalService.getTemplateDetail(templateId);
        return ResponseEntity.ok(templateDetail);
    }
}