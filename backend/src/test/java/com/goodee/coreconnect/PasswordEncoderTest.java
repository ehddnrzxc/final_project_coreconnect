package com.goodee.coreconnect;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import lombok.extern.slf4j.Slf4j;

/**
 * BCrypt로 비밀번호 인코딩 테스트용 메소드
 */
@Slf4j
public class PasswordEncoderTest {
    public static void main(String[] args) {
        String raw = "coreconnect@sss";
        String encoded = new BCryptPasswordEncoder().encode(raw);
        log.info("pw: " + encoded);
    }
}

