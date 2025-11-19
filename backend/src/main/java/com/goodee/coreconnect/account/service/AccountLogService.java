package com.goodee.coreconnect.account.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.goodee.coreconnect.account.dto.response.AccountLogResponseDTO;
import com.goodee.coreconnect.account.enums.LogActionType;
import com.goodee.coreconnect.user.entity.User;

/**
 * 계정 로그인 이력 관련 서비스 인터페이스
 */
public interface AccountLogService {
    
    /**
     * 로그인 이력 저장
     * @param user 사용자
     * @param actionType 로그 액션 타입 (LOGIN, LOGOUT, FAIL, REFRESH)
     * @param ipAddress IP 주소
     */
    void saveLog(User user, LogActionType actionType, String ipAddress);
    
    /**
     * 로그인 실패 이력 저장 (사용자가 null일 수 있음)
     * @param email 이메일 (사용자가 존재하지 않을 수 있음)
     * @param ipAddress IP 주소
     */
    void saveLoginFailLog(String email, String ipAddress);
    
    /**
     * 모든 로그인 이력 조회
     * @param pageable 페이지 정보
     * @return 로그인 이력 페이지
     */
    Page<AccountLogResponseDTO> getAllLogs(Pageable pageable);
    
    /**
     * 특정 사용자의 로그인 이력 조회
     * @param email 사용자 이메일
     * @param pageable 페이지 정보
     * @return 로그인 이력 페이지
     */
    Page<AccountLogResponseDTO> getLogsByUserEmail(String email, Pageable pageable);
    
    /**
     * 특정 액션 타입의 로그인 이력 조회
     * @param actionType 액션 타입
     * @param pageable 페이지 정보
     * @return 로그인 이력 페이지
     */
    Page<AccountLogResponseDTO> getLogsByActionType(LogActionType actionType, Pageable pageable);
    
    /**
     * 특정 사용자의 특정 액션 타입 로그인 이력 조회
     * @param email 사용자 이메일
     * @param actionType 액션 타입
     * @param pageable 페이지 정보
     * @return 로그인 이력 페이지
     */
    Page<AccountLogResponseDTO> getLogsByUserEmailAndActionType(String email, LogActionType actionType, Pageable pageable);
}

