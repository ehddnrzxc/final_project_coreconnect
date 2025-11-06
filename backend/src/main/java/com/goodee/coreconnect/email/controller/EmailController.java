package com.goodee.coreconnect.email.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.goodee.coreconnect.common.dto.response.ResponseDTO;
import com.goodee.coreconnect.email.dto.request.EmailSendRequestDTo;
import com.goodee.coreconnect.email.dto.response.EmailResponseDTO;
import com.goodee.coreconnect.email.service.EmailService;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/email")
public class EmailController {

    private final EmailService emailService;

    // 이메일 발송
    @PostMapping("/send")
    public ResponseEntity<ResponseDTO<EmailResponseDTO>> send(@RequestBody EmailSendRequestDTo requestDTO) {
        EmailResponseDTO result = emailService.sendEmail(requestDTO);
        return ResponseEntity.ok(ResponseDTO.success(result, "이메일 발송 성공"));
    }

    // 이메일 상세조회
    @GetMapping("/{emailId}")
    public ResponseEntity<ResponseDTO<EmailResponseDTO>> getEmailDetail(@PathVariable Integer emailId) {
        EmailResponseDTO result = emailService.getEmailDetail(emailId);
        return ResponseEntity.ok(ResponseDTO.success(result, "이메일 상세조회 성공"));
    }

    // 받은메일함
    @GetMapping("/inbox")
    public ResponseEntity<ResponseDTO<Page<EmailResponseDTO>>> getInbox(
            @RequestParam Integer userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<EmailResponseDTO> result = emailService.getInbox(userId, page, size);
        return ResponseEntity.ok(ResponseDTO.success(result, "받은메일함 조회 성공"));
    }

    // 보낸메일함
    @GetMapping("/sentbox")
    public ResponseEntity<ResponseDTO<Page<EmailResponseDTO>>> getSentbox(
            @RequestParam Integer userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<EmailResponseDTO> result = emailService.getSentbox(userId, page, size);
        return ResponseEntity.ok(ResponseDTO.success(result, "보낸메일함 조회 성공"));
    }

    // 반송함
    @GetMapping("/bounce")
    public ResponseEntity<ResponseDTO<Page<EmailResponseDTO>>> getBounceBox(
            @RequestParam Integer userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<EmailResponseDTO> result = emailService.getBounceBox(userId, page, size);
        return ResponseEntity.ok(ResponseDTO.success(result, "반송함 조회 성공"));
    }
}