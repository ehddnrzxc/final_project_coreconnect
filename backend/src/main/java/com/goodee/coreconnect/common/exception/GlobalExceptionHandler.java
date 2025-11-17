package com.goodee.coreconnect.common.exception;

import java.util.Collections;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import com.goodee.coreconnect.common.dto.response.ResponseDTO;

import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice // ⭐️ 모든 @RestController의 예외를 처리
public class GlobalExceptionHandler {

    /**
     * 1. 접근 권한 예외 처리 (HTTP 403 Forbidden)
     * (관리자 전용 기능 접근 시 권한이 없을 경우)
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ResponseDTO<Void>> handleAccessDenied(AccessDeniedException ex) {
        ResponseDTO<Void> res = ResponseDTO.<Void>builder()
                .status(HttpStatus.FORBIDDEN.value()) // 403
                .message(ex.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(res);
    }
    
    /**
     * 2. SecurityException (비공개 게시글 접근, 로그인 필요 등)
     * (AccessDeniedException과 동일한 403 응답)
     */
    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ResponseDTO<Void>> handleSecurityException(SecurityException ex) {
        ResponseDTO<Void> res = ResponseDTO.<Void>builder()
                .status(HttpStatus.FORBIDDEN.value()) // 403
                .message(ex.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(res);
    }
  
    /**
     * 3. @Valid 유효성 검사 실패 시 처리 (HTTP 400 Bad Request)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidationExceptions(MethodArgumentNotValidException ex) {
        
        // ⭐️ 오류 메시지를 보기 좋게 가공합니다.
        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> fieldError.getField() + ": " + fieldError.getDefaultMessage())
                .collect(Collectors.joining(", "));
        
        log.warn("Validation Error: {}", errorMessage);

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST) // 400
                .body("입력값 오류: " + errorMessage);
    }

    /**
     * 4. 엔티티를 찾지 못했을 때 처리 (HTTP 404 Not Found)
     * (서비스의 findById().orElseThrow() 등)
     */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<String> handleEntityNotFound(EntityNotFoundException ex) {
        log.warn("Entity Not Found: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND) // 404
                .body(ex.getMessage()); // (예: "문서를 찾을 수 없습니다. ID: 123")
    }

    /**
     * 5. 비즈니스 로직 상 예외 처리 (HTTP 400 Bad Request)
     * (서비스의 new IllegalStateException() 등)
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<String> handleIllegalState(IllegalStateException ex) {
        log.warn("Illegal State: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST) // 400
                .body(ex.getMessage()); // (예: "진행 중인 문서만 결재할 수 있습니다.")
    }
    
    /**
     * 6. IllegalArgumentException에 대한 예외 처리
     * @param ex
     * @return ResponseEntity
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ex.getMessage());
    }
    
    
    /**
     * 7. ResponseStatusException에 대한 예외 처리
     * @param ex
     * @return ResponseStatusException
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<String> handleException(ResponseStatusException ex) {
        // ⭐️ 예상치 못한 오류는 심각하므로 Error 레벨로 로그를 남깁니다.
        log.error("401 UNAUTHORIZED: {}", ex.getMessage(), ex); 
        
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED) // 401
                .body("ResponseStatusException 오류가 발생했습니다. 관리자에게 문의하세요.");
    }

    /**
     * 8. 그 외 모든 예상치 못한 예외 처리 (HTTP 500 Internal Server Error)
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleException(Exception ex) {
        // ⭐️ 예상치 못한 오류는 심각하므로 Error 레벨로 로그를 남깁니다.
        log.error("Internal Server Error: {}", ex.getMessage(), ex); 
        
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR) // 500
                .body("서버 내부 오류가 발생했습니다. 관리자에게 문의하세요.");
    }
    
    
    @ExceptionHandler(ChatNotFoundException.class)
    public ResponseEntity<?> handleChatNotFound(ChatNotFoundException ex) {
        // 빈 배열+200으로 강제 처리
        return ResponseEntity.ok(ResponseDTO.success(Collections.emptyList(), "채팅 메시지 없음"));
    }
}