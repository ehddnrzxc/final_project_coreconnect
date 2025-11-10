package com.goodee.coreconnect.email.controller;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.http.HttpHeaders;        // 꼭 Spring용!
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.InputStreamResource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.common.dto.response.ResponseDTO;
import com.goodee.coreconnect.email.dto.request.EmailSendRequestDTO;
import com.goodee.coreconnect.email.dto.request.MarkMailReadRequestDTO;
import com.goodee.coreconnect.email.dto.response.EmailResponseDTO;
import com.goodee.coreconnect.email.entity.EmailFile;
import com.goodee.coreconnect.email.repository.EmailFileRepository;
import com.goodee.coreconnect.email.repository.EmailRecipientRepository;
import com.goodee.coreconnect.email.service.EmailFileStorageService;
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
    private final EmailFileRepository emailFileRepository;
    private final EmailFileStorageService emFileStorageService;
    
    // 이메일 발송
    @Operation(summary = "이메일 발송", description = "이메일을 발송합니다.")
    @PostMapping( value = "/send", consumes = "multipart/form-data")
    public ResponseEntity<ResponseDTO<EmailResponseDTO>> send( @RequestPart("data") EmailSendRequestDTO requestDTO,
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

    // [NEW] 개별 메일 "읽음" 처리 API (프론트 상세 진입 후 읽음뷰 반영 위한 별도 PATCH)
    @Operation(summary = "메일 읽음처리", description = "개별 메일을 읽음 처리합니다.")
    @PatchMapping("/{emailId}/read")
    public ResponseEntity<ResponseDTO<Boolean>> markMailAsRead(
            @PathVariable("emailId") Integer emailId,
            @RequestBody(required = true) MarkMailReadRequestDTO request
    ) {
        boolean updated = emailService.markMailAsRead(emailId, request.getUserEmail());
        return ResponseEntity.ok(ResponseDTO.success(updated, updated ? "메일 읽음 처리 성공" : "이미 읽은 메일"));
    }
    
    
    
    
    
    // 받은메일함 '안읽은 메일' 개수만 반환 (프론트 뱃지 Badge 표시용)
//    @Operation(summary = "받은메일함 안읽은 메일 개수", description = "받은메일함 중 안읽은 메일 개수를 반환합니다.")
//    @GetMapping("/inbox/unread-count")
//    public ResponseEntity<ResponseDTO<Integer>> getUnreadInboxCount(@RequestParam("userEmail") String userEmail) {
//        int unreadCount = emailRecipientRepository.countByEmailRecipientAddressAndEmailReadYn(userEmail, false);
//        return ResponseEntity.ok(ResponseDTO.success(unreadCount, "안읽은 메일 개수 조회 성공"));
//    }
    
    @GetMapping("/file/download/{fileId}")
    public ResponseEntity<InputStreamResource> downloadAttachment(@PathVariable("fileId") Integer fileId, HttpServletResponse response) {
        // 1. DB에서 첨부파일 엔티티 조회
        EmailFile file = emailFileRepository.findById(fileId)
            .orElseThrow(() -> new RuntimeException("첨부파일 정보를 찾을 수 없습니다."));

        // 2. 실파일(InputStream 등) 읽기 (S3스토리지/로컬 구현에 따라 분기)
        InputStream inputStream = emFileStorageService.loadFileAsInputStream(file);

        // 3. Content-Disposition 헤더(filename 인코딩 주의)
        String encodedFilename = URLEncoder.encode(file.getEmailFileName(), StandardCharsets.UTF_8)
                                           .replaceAll("\\+", "%20");
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFilename);

        // 4. Content-Type (기본 바이너리, 혹은 확장자별 지정)
        MediaType contentType = MediaType.APPLICATION_OCTET_STREAM;

        return ResponseEntity.ok()
                .headers(headers)
                .contentLength(file.getEmailFileSize())
                .contentType(contentType)
                .body(new InputStreamResource(inputStream));
    }
    
    
    // 임시메일(저장) 등록
    @PostMapping(value = "/draft", consumes = "multipart/form-data")
    public ResponseEntity<ResponseDTO<EmailResponseDTO>> saveDraft(
        @RequestPart("data") EmailSendRequestDTO requestDTO,
        @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments,
        @AuthenticationPrincipal CustomUserDetails user
    ) {
        String email = user.getEmail();
        Optional<User> userOptional = userRepository.findByEmail(email);
        Integer senderId = userOptional.map(User::getId)
            .orElseThrow(() -> new RuntimeException("사용자 정보를 찾을 수 없습니다."));
        requestDTO.setSenderAddress(email);     // ★ 반드시 senderEmail 세팅
        requestDTO.setSenderId(senderId);       // ★ 반드시 senderId 세팅

        EmailResponseDTO result = null;
		try {
			result = emailService.saveDraft(requestDTO, attachments);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        return ResponseEntity.ok(ResponseDTO.success(result, "임시메일 저장 성공"));
    }
    
    
 // 임시보관함 목록
    @GetMapping("/draftbox")
    public ResponseEntity<ResponseDTO<Page<EmailResponseDTO>>> getDraftbox(
        @RequestParam("userEmail") String userEmail,
        @RequestParam(value="page", defaultValue="0") int page,
        @RequestParam(value="size", defaultValue="10") int size
    ) {
        Page<EmailResponseDTO> result = emailService.getDraftbox(userEmail, page, size);
        return ResponseEntity.ok(ResponseDTO.success(result, "임시보관함 조회 성공"));
    }

    // 임시보관함 개수 (Redis 활용)
    @GetMapping("/draftbox/count")
    public ResponseEntity<ResponseDTO<Long>> getDraftCount(@RequestParam String userEmail) {
        long count = emailService.getDraftCount(userEmail); // 내부에 Redis/caching 사용
        return ResponseEntity.ok(ResponseDTO.success(count, "임시보관함 개수 조회 성공"));
    }

    // 임시메일 삭제
    @DeleteMapping("/draft/{draftId}")
    public ResponseEntity<ResponseDTO<Boolean>> deleteDraft(@PathVariable("draftId") Integer draftId) {
        boolean deleted = emailService.deleteDraft(draftId);
        return ResponseEntity.ok(ResponseDTO.success(deleted, deleted ? "삭제 성공" : "삭제 실패"));
    }
    
    
    
}