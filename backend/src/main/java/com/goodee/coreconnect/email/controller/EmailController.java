package com.goodee.coreconnect.email.controller;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;

import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.Part;
import java.nio.charset.StandardCharsets;
import java.util.Collection;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.http.HttpHeaders;        // 꼭 Spring용!
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.InputStreamResource;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.goodee.coreconnect.common.dto.response.ResponseDTO;
import com.goodee.coreconnect.email.dto.request.DeleteMailsRequest;
import com.goodee.coreconnect.email.dto.request.EmailSendRequestDTO;
import com.goodee.coreconnect.email.dto.request.MarkMailReadRequestDTO;
import com.goodee.coreconnect.email.dto.response.DeleteMailsResponse;
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

    /**
     * 이메일 발송 (multipart/form-data, 'data' part JSON)
     */
    @Operation(summary = "이메일 발송", description = "이메일을 발송합니다.")
    @PostMapping(value = "/send", consumes = "multipart/form-data")
    public ResponseEntity<ResponseDTO<EmailResponseDTO>> send(
            @RequestPart("data") EmailSendRequestDTO requestDTO,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments,
            @AuthenticationPrincipal CustomUserDetails user,
            HttpServletRequest request
    ) {
        // 0) 기초정보 로그
        log.info("[send] incoming send request. senderPrincipal={}, attachmentsCount={}",
                user == null ? "null" : user.getEmail(), attachments == null ? 0 : attachments.size());

        // 로그인 정보에서 현재 사용자 email 추출 및 senderId 할당
        String email = user.getEmail();
        Optional<User> userOptional = userRepository.findByEmail(email);
        log.info("user: {}", userOptional);
        Integer senderId = userOptional.map(User::getId)
                .orElseThrow(() -> new RuntimeException("사용자 정보를 찾을 수 없습니다."));
        requestDTO.setSenderAddress(email);

        // DTO serialization log (for debugging)
        try {
            ObjectMapper om = new ObjectMapper();
            log.info("[send] bound EmailSendRequestDTO = {}", om.writeValueAsString(requestDTO));
        } catch (Exception ex) {
            log.warn("[send] failed to serialize requestDTO: {}", ex.getMessage());
        }

        // If emailContent is null, dump raw multipart 'data' part to inspect what the client sent
        if (requestDTO.getEmailContent() == null) {
            log.warn("[send] requestDTO.emailContent == null - dumping raw multipart 'data' part");
            try {
                Part p = request.getPart("data");
                if (p != null) {
                    String raw = new String(p.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                    log.warn("[send] raw 'data' part content: {}", raw);
                } else {
                    log.warn("[send] request.getPart('data') == null -> listing parts");
                    Collection<Part> parts = request.getParts();
                    for (Part part : parts) {
                        log.warn("[send] part name='{}', size={}", part.getName(), part.getSize());
                    }
                }
            } catch (Exception ex) {
                log.error("[send] error reading raw 'data' part: {}", ex.getMessage(), ex);
            }
        }

        // attachments info logging
        if (attachments != null) {
            for (MultipartFile f : attachments) {
                log.info("[send] attachment: name='{}', size={}, contentType={}",
                        f.getOriginalFilename(), f.getSize(), f.getContentType());
            }
        }

        // 3. DTO에 강제로 넣거나, 아래 서비스 따로 인자 전달
        requestDTO.setSenderId(senderId);

        EmailResponseDTO result = null;
        try {
            result = emailService.sendEmail(requestDTO, attachments);
        } catch (IOException e) {
            log.error("[send] sendEmail failed", e);
            throw new RuntimeException(e);
        }
        return ResponseEntity.ok(ResponseDTO.success(result, "이메일 발송 성공"));
    }

    // 이메일 상세조회
    @Operation(summary = "발송된 이메일 상세조회", description = "발송된 이메일을 상세조회 합니다.")
    @GetMapping("/{emailId:\\\\d+}")
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
    	 System.out.println("userEmail = " + userEmail); 
        long count = emailService.getDraftCount(userEmail); // 내부에 Redis/caching 사용
        return ResponseEntity.ok(ResponseDTO.success(count, "임시보관함 개수 조회 성공"));
    }
    
    /**
     * 임시저장 메일 상세조회
     * [프론트 메일쓰기 페이지 바인딩용]
     * */
    @GetMapping("/draft/{draftId}")
    public ResponseEntity<ResponseDTO<EmailResponseDTO>> getDraftDetail(
            @PathVariable("draftId") Integer draftId,
            @RequestParam("userEmail") String userEmail
    ) {
        // 서비스에서 상세 데이터 조회 (소유자 검증 포함)
        EmailResponseDTO dto = emailService.getDraftMailDetail(draftId, userEmail);
        // 프론트에서 바로 사용 가능하도록 응답
        return ResponseEntity.ok(ResponseDTO.success(dto, "임시저장 메일 상세조회 성공"));
    }
    
    /**
     * 임시저장 메일(DRAFT) 삭제
     * [프론트에서 deleteDraftMail 호출시 실행됨]
     */
    @DeleteMapping("/draft/delete/{draftId}")
    public ResponseEntity<Void> deleteDraftMail(@PathVariable("draftId") Integer draftId) {
    	log.info("draftId: {}", draftId);
        emailService.deleteDraftMail(draftId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 선택된 메일들을 휴지통으로 이동(상태를 TRASH로 바꿈)
     * 요청자는 본인이 발신자이거나 수신자일 경우만 적용
     */
    @CrossOrigin(origins="http://localhost:5173", allowCredentials="true")
    @PostMapping("/move-to-trash")
    public ResponseEntity<?> moveToTrash(@RequestBody List<Integer> emailIds, @AuthenticationPrincipal CustomUserDetails user) {
        String userEmail = user != null ? user.getName() : null; // 프로젝트에 맞게 수정(예: CustomUserDetails)
        emailService.moveEmailsToTrash(emailIds, userEmail);
        return ResponseEntity.ok().build();
    }

    /**
     * 현재 사용자의 휴지통 비우기: TRASH -> DELETED
     */
    @PostMapping("/trash/empty")
    public ResponseEntity<?> emptyTrash(@AuthenticationPrincipal CustomUserDetails user) {
        String userEmail = user != null ? user.getName() : null;
        emailService.emptyTrash(userEmail);
        return ResponseEntity.ok().build();
    }
    

    /**
     * 현재 사용자가 선택한 mailIds를 '휴지통(삭제)' 처리
     * 요청 예: DELETE /api/v1/mail  Body: { "mailIds": [1,2,3] }
     */
    @DeleteMapping("/trash")
    public ResponseEntity<DeleteMailsResponse> deleteMails(@RequestBody DeleteMailsRequest req) {
        DeleteMailsResponse res = emailService.deleteMailsForCurrentUser(req);
        return ResponseEntity.ok(res);
    }
    
    //  휴지통 목록 (페이징)
    @GetMapping("/trash")
    public ResponseEntity<ResponseDTO<Page<EmailResponseDTO>>> getTrash(
            @RequestParam("userEmail") String userEmail,
            @RequestParam(value="page", defaultValue="0") int page,
            @RequestParam(value="size", defaultValue="10") int size
    ) {
        Page<EmailResponseDTO> result = emailService.getTrashMails(userEmail, page, size);
        return ResponseEntity.ok(ResponseDTO.success(result, "휴지통 조회 성공"));
    }

    //  예약 메일 목록 (페이징) - scheduled mails where scheduledAt > now and status = SCHEDULED
    @GetMapping("/reserved")
    public ResponseEntity<ResponseDTO<Page<EmailResponseDTO>>> getScheduled(
            @RequestParam("userEmail") String userEmail,
            @RequestParam(value="page", defaultValue="0") int page,
            @RequestParam(value="size", defaultValue="10") int size
    ) {
        Page<EmailResponseDTO> result = emailService.getScheduledMails(userEmail, page, size);
        return ResponseEntity.ok(ResponseDTO.success(result, "예약메일 조회 성공"));
    }
    
}