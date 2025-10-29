package com.goodee.coreconnect.common.exception;

import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice // ⭐️ 모든 @RestController의 예외를 처리
public class GlobalExceptionHandler {

    /**
     * 1. @Valid 유효성 검사 실패 시 처리 (HTTP 400 Bad Request)
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
     * 2. 엔티티를 찾지 못했을 때 처리 (HTTP 404 Not Found)
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
     * 3. 비즈니스 로직 상 예외 처리 (HTTP 400 Bad Request)
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
     * IllegalArgumentException에 대한 예외 처리
     * @param ex
     * @return ResponseEntity
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ex.getMessage());
    }

    /**
     * 4. 그 외 모든 예상치 못한 예외 처리 (HTTP 500 Internal Server Error)
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleException(Exception ex) {
        // ⭐️ 예상치 못한 오류는 심각하므로 Error 레벨로 로그를 남깁니다.
        log.error("Internal Server Error: {}", ex.getMessage(), ex); 
        
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR) // 500
                .body("서버 내부 오류가 발생했습니다. 관리자에게 문의하세요.");
    }
    
    


    
    
}