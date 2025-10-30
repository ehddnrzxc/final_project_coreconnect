package com.goodee.coreconnect.common.notification.controller;

import java.security.Principal;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.chat.dto.response.NotificationReadResponseDTO;
import com.goodee.coreconnect.common.notification.dto.NotificationSendRequestDTO;
import com.goodee.coreconnect.common.notification.service.NotificationService;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
@RequestMapping("/api/v1/notification")
@RestController
public class NotificationController {
	private final NotificationService notificationService;
	private final UserRepository userRepository;

	 @Operation(summary = "알림 읽음 처리", description = "알림을 읽음 처리합니다.")
	    @PutMapping("/{notificationId}/read")
	    public ResponseEntity<NotificationReadResponseDTO> markNotificationRead(
	        @PathVariable("notificationId") Integer notificationId,
	        Principal principal
	    ) {
	        if (principal == null) {
	            return ResponseEntity.status(401).build();
	        }
	        String email = principal.getName(); // 기본 Principal에서 이름(email) 추출
	        NotificationReadResponseDTO result = notificationService.markAsRead(notificationId, email);
	        return ResponseEntity.ok(result);
	    }

	 @Operation(summary = "알림 수동 발송", description = "외부 시스템에서 알림을 수동 발송합니다.")
	 @PostMapping("/send")
	 public ResponseEntity<?> sendNotification(@RequestBody NotificationSendRequestDTO dto, Principal principal) {
	     if (principal == null) {
	         return ResponseEntity.status(401).build();
	     }
	     // senderEmail: principal.getName()이 email이라고 가정
	     String senderEmail = principal.getName();
	     
	     // UserRepository를 통해 sender 정보 조회 (UserRepository를 주입받아야 함)
	     User sender = userRepository.findByEmail(senderEmail)
	         .orElseThrow(() -> new IllegalArgumentException("발신자 정보를 찾을 수 없습니다: " + senderEmail));
	     Integer senderId = sender.getId();
	     String senderName = sender.getName();

	     notificationService.sendNotification(
	         dto.getRecipientId(),
	         dto.getType(),
	         dto.getMessage(),
	         dto.getChatId(),
	         dto.getRoomId(),
	         senderId,
	         senderName
	     );
	     return ResponseEntity.ok().build();
	 }
	
	
}
