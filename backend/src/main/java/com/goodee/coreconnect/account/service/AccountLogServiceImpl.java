package com.goodee.coreconnect.account.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.account.dto.response.AccountLogResponseDTO;
import com.goodee.coreconnect.account.entity.AccountLog;
import com.goodee.coreconnect.account.enums.LogActionType;
import com.goodee.coreconnect.account.repository.AccountLogRepository;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/** 계정 로그인 이력 관련 서비스 구현 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AccountLogServiceImpl implements AccountLogService {
    
    private final AccountLogRepository accountLogRepository;
    private final UserRepository userRepository;
    
    /** 로그인 이력 저장 */
    @Override
    @Transactional
    public void saveLog(User user, LogActionType actionType, String ipv4, String ipv6) {
        try {
            AccountLog accountLog = AccountLog.createAccountLog(user, actionType, ipv4, ipv6);
            accountLogRepository.save(accountLog);
            log.debug("계정 로그 저장 완료: user={}, actionType={}, ipv4={}, ipv6={}", 
                user.getEmail(), actionType, ipv4, ipv6);
        } catch (Exception e) {
            log.error("계정 로그 저장 실패: user={}, actionType={}, ipv4={}, ipv6={}", 
                user != null ? user.getEmail() : "null", actionType, ipv4, ipv6, e);
        }
    }
    
    /** 로그인 실패 이력 저장 */
    @Override
    @Transactional
    public void saveLoginFailLog(String email, String ipv4, String ipv6) {
        try {
            User user = userRepository.findByEmail(email).orElse(null);
            
            if (user != null) {
                AccountLog accountLog = AccountLog.createAccountLog(user, LogActionType.FAIL, ipv4, ipv6);
                accountLogRepository.save(accountLog);
                log.debug("로그인 실패 로그 저장 완료: user={}, ipv4={}, ipv6={}", email, ipv4, ipv6);
            } else {
                log.debug("존재하지 않는 사용자 로그인 시도: email={}, ipv4={}, ipv6={}", email, ipv4, ipv6);
            }
        } catch (Exception e) {
            log.error("로그인 실패 로그 저장 실패: email={}, ipv4={}, ipv6={}", email, ipv4, ipv6, e);
        }
    }
    
    /** 모든 로그인 이력 조회 */
    @Override
    @Transactional(readOnly = true)
    public Page<AccountLogResponseDTO> getAllLogs(Pageable pageable) {
        return accountLogRepository.findAllByOrderByActionTimeDesc(pageable)
            .map(AccountLogResponseDTO::toDTO);
    }
    
    /** 특정 사용자의 로그인 이력 조회 */
    @Override
    @Transactional(readOnly = true)
    public Page<AccountLogResponseDTO> getLogsByUserEmail(String email, Pageable pageable) {
        return accountLogRepository.findByUserEmailOrderByActionTimeDesc(email, pageable)
            .map(AccountLogResponseDTO::toDTO);
    }
    
    /** 특정 액션 타입의 로그인 이력 조회 */
    @Override
    @Transactional(readOnly = true)
    public Page<AccountLogResponseDTO> getLogsByActionType(LogActionType actionType, Pageable pageable) {
        return accountLogRepository.findByActionTypeOrderByActionTimeDesc(actionType, pageable)
            .map(AccountLogResponseDTO::toDTO);
    }
    
    /** 특정 사용자의 특정 액션 타입 로그인 이력 조회 */
    @Override
    @Transactional(readOnly = true)
    public Page<AccountLogResponseDTO> getLogsByUserEmailAndActionType(String email, LogActionType actionType, Pageable pageable) {
        return accountLogRepository.findByUserEmailAndActionTypeOrderByActionTimeDesc(email, actionType, pageable)
            .map(AccountLogResponseDTO::toDTO);
    }
}

