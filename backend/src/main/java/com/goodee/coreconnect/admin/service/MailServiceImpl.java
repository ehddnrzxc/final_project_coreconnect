package com.goodee.coreconnect.admin.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MailServiceImpl implements MailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from; // 보내는 사람 주소(설정 파일에서 가져옴)

    public void sendTempPassword(String to, String tempPassword) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setFrom(from);
        message.setSubject("[CoreConnect] 비밀번호 초기화 안내");
        message.setText(
            """
            안녕하세요.

            요청하신 비밀번호 초기화가 완료되었습니다.

            임시 비밀번호: %s

            로그인 후 마이페이지에서 비밀번호를 변경해 주세요.
            """.formatted(tempPassword)
        );

        mailSender.send(message);
    }
}
