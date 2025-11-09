package com.goodee.coreconnect.email.controller;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.common.dto.response.ResponseDTO;
import com.goodee.coreconnect.email.dto.request.EmailSendRequestDTo;
import com.goodee.coreconnect.email.dto.response.EmailResponseDTO;
import com.goodee.coreconnect.email.repository.EmailRecipientRepository;
import com.goodee.coreconnect.email.service.EmailService;
import com.goodee.coreconnect.security.userdetails.CustomUserDetails;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/email")
public class EmailController {

    private final EmailService emailService;
    private final UserRepository userRepository;
    private final EmailRecipientRepository emailRecipientRepository;
    
    // 이메일 발송
    @Operation(summary = "이메일 발송", description = "이메일을 발송합니다.")
    @PostMapping( value = "/send", consumes = "multipart/form-data")
    public ResponseEntity<ResponseDTO<EmailResponseDTO>> send( @RequestPart("data") EmailSendRequestDTo requestDTO,
    		@RequestPart(value = "attachments", required = false) List<MultipartFile> attachments, // 다중 파일
    		@AuthenticationPrincipal CustomUserDetails user
    		) {
    	// 1. 로그인 정보에서 현재 사용자 email 추출
    	String email = user.getEmail();
    	// 2. email로 User 조회 -> sender_id 할당
    	Optional<User> userOptional = userRepository.findByEmail(email);
    	log.info("user: {}", userOptional);
    	Integer senderId = userOptional.map(User::getId)
    			.orElseThrow(() -> new RuntimeException("사용자 정보를 찾을 수 없습니다."));
    	requestDTO.setSenderAddress(email);
    	
    	
    	// 3. DTO에 강제로 넣거나, 아래 서비스 따로 인자 전달
    	requestDTO.setSenderId(senderId);
    	
        EmailResponseDTO result = null;
		try {
			result = emailService.sendEmail(requestDTO, attachments);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        return ResponseEntity.ok(ResponseDTO.success(result, "이메일 발송 성공"));
    }

    // 이메일 상세조회
    @Operation(summary = "발송된 이메일 상세조회", description = "발송된 이메일을 상세조회 합니다.")
    @GetMapping("/{emailId}")
    public ResponseEntity<ResponseDTO<EmailResponseDTO>> getEmailDetail(@PathVariable("emailId") Integer emailId,  @RequestParam("userEmail") String userEmail ) {
        EmailResponseDTO result = emailService.getEmailDetail(emailId, userEmail);
        return ResponseEntity.ok(ResponseDTO.success(result, "이메일 상세조회 성공"));
    }

    // 받은메일함
    @Operation(summary = "수신된 이메일 조회", description = "수신된 이메일을 조회합니다.")
    @GetMapping("/inbox")
    public ResponseEntity<ResponseDTO<Page<EmailResponseDTO>>> getInbox(
    		@RequestParam("userEmail") String userEmail, /* 이름 명확히 */
    	    @RequestParam(value = "page", defaultValue = "0") int page,
    	    @RequestParam(value = "size", defaultValue = "1") int size,
    	    @RequestParam(value = "filter", required = false) String filter
    ) {
    	// filter: null or "today"/"unread"
        Page<EmailResponseDTO> result = emailService.getInbox(userEmail, page, size, filter);
        int unreadCount = emailRecipientRepository.countByEmailRecipientAddressAndEmailReadYn(userEmail, false);
        // {"data":result, "unreadCount":unreadCount} 형태로 응답  
        return ResponseEntity.ok(ResponseDTO.success(result, "받은메일함 조회 성공"));
    }

    // 보낸메일함
    @Operation(summary = "발신된 이메일 조회", description = "발신된 이메일을 조회합니다.")
    @GetMapping("/sentbox")
    public ResponseEntity<ResponseDTO<Page<EmailResponseDTO>>> getSentbox(
    	@RequestParam("userEmail") String userEmail,
        @RequestParam(value = "page", defaultValue = "0") int page,
        @RequestParam(value = "size", defaultValue = "1") int size
    ) {
    	log.info("userEmail: {}", userEmail);
        Page<EmailResponseDTO> result = emailService.getSentbox(userEmail, page, size);
        return ResponseEntity.ok(ResponseDTO.success(result, "보낸메일함 조회 성공"));
    }

    // 반송함
    @Operation(summary = "반송된 이메일 조회", description = "반송된 이메일을 조회합니다.")
    @GetMapping("/bounce")
    public ResponseEntity<ResponseDTO<Page<EmailResponseDTO>>> getBounceBox(
            @RequestParam Integer userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "1") int size
    ) {
        Page<EmailResponseDTO> result = emailService.getBounceBox(userId, page, size);
        return ResponseEntity.ok(ResponseDTO.success(result, "반송함 조회 성공"));
    }
    
    
    // 받은메일함 '안읽은 메일' 개수만 반환 (프론트 뱃지 Badge 표시용)
    @Operation(summary = "받은메일함 안읽은 메일 개수", description = "받은메일함 중 안읽은 메일 개수를 반환합니다.")
    @GetMapping("/inbox/unread-count")
    public ResponseEntity<ResponseDTO<Integer>> getUnreadInboxCount(@RequestParam("userEmail") String userEmail) {
        int unreadCount = emailRecipientRepository.countByEmailRecipientAddressAndEmailReadYn(userEmail, false);
        return ResponseEntity.ok(ResponseDTO.success(unreadCount, "안읽은 메일 개수 조회 성공"));
    }
}