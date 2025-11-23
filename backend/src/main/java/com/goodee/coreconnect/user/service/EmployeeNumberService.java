package com.goodee.coreconnect.user.service;

import java.time.Year;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * 사번 생성 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeNumberService {

    private final UserRepository userRepository;

    /**
     * 사번 자동 생성 (연도 4자리 + 자동 증가 3자리)
     * 예: 2024001, 2024002, ...
     * 
     * @return 생성된 사번 (예: "2024001")
     */
    public String generateEmployeeNumber() {
        String currentYear = String.valueOf(Year.now().getValue());
        
        // 현재 연도로 시작하는 사번 중 최대값 조회 (동시성 처리를 위해 락 사용)
        Integer maxNumber = userRepository.findMaxEmployeeNumberByYear(currentYear);
        
        // 다음 번호 생성 (최대값 + 1)
        int nextNumber = maxNumber + 1;
        
        // 3자리 숫자로 포맷팅 (001, 002, ...)
        String formattedNumber = String.format("%03d", nextNumber);
        
        // 연도 4자리 + 3자리 숫자 조합
        return currentYear + formattedNumber;
    }
}

