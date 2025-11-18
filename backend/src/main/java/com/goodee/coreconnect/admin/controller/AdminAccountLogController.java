package com.goodee.coreconnect.admin.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.account.dto.response.AccountLogResponseDTO;
import com.goodee.coreconnect.account.entity.LogActionType;
import com.goodee.coreconnect.account.service.AccountLogService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/** 관리자용 로그인 이력 조회 컨트롤러 */
@RestController
@RequestMapping("/api/v1/admin/account-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Account Log API", description = "관리자용 로그인 이력 조회 API")
@Slf4j
public class AdminAccountLogController {
    
    private final AccountLogService accountLogService;
    
    /** 모든 로그인 이력 조회 */
    @Operation(summary = "로그인 이력 조회", description = "모든 사용자의 로그인 이력을 조회합니다.")
    @GetMapping
    public ResponseEntity<Page<AccountLogResponseDTO>> getAccountLogs(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String email,
        @RequestParam(required = false) LogActionType actionType
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("actionTime").descending());
        
        Page<AccountLogResponseDTO> logs;
        
        if (email != null && !email.isEmpty() && actionType != null) {
            // 이메일과 액션 타입 모두 지정된 경우
            logs = accountLogService.getLogsByUserEmailAndActionType(email, actionType, pageable);
        } else if (email != null && !email.isEmpty()) {
            // 이메일만 지정된 경우
            logs = accountLogService.getLogsByUserEmail(email, pageable);
        } else if (actionType != null) {
            // 액션 타입만 지정된 경우
            logs = accountLogService.getLogsByActionType(actionType, pageable);
        } else {
            // 필터 없이 전체 조회
            logs = accountLogService.getAllLogs(pageable);
        }
        
        return ResponseEntity.ok(logs);
    }
}

