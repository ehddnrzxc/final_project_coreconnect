package com.goodee.coreconnect.chat.controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.chat.dto.request.CreateRoomRequestDTO;
import com.goodee.coreconnect.chat.dto.request.SendMessageRequestDTO;
import com.goodee.coreconnect.chat.dto.response.ChatResponseDTO;
import com.goodee.coreconnect.chat.dto.response.ChatRoomResponseDTO;
import com.goodee.coreconnect.chat.entity.Chat;
import com.goodee.coreconnect.chat.entity.ChatRoom;
import com.goodee.coreconnect.chat.entity.Notification;
import com.goodee.coreconnect.chat.enums.NotificationType;
import com.goodee.coreconnect.chat.repository.ChatRepository;
import com.goodee.coreconnect.chat.repository.NotificationRepository;
import com.goodee.coreconnect.chat.service.ChatRoomService;
import com.goodee.coreconnect.common.dto.response.ResponseDTO;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
@RequestMapping("/api/v1/chat")
@RestController
public class ChatMessageController {


	private final ChatRoomService chatRoomService;
	private final UserRepository userRepository;
	private final ChatRepository chatRepository;
	private final NotificationRepository notificationRepository;
	
	@PostMapping
    public ResponseEntity<ChatRoom> createChatRoom(
    		Principal principal, // ← 이렇게!
            @RequestBody CreateRoomRequestDTO request
    		
    		) {  // 2. 방 이름, 초대할 ID 목록
		
        String creatorEmail = principal.getName();
        // 서비스를 호출할 때 로그인한 사용자 정보(creatorEmail)를 넘겨줍니다.
        ChatRoom newChatRoom = chatRoomService.createChatRoom(creatorEmail, request.getUserIds(), creatorEmail);
        
        return new ResponseEntity<>(newChatRoom, HttpStatus.CREATED);
    }
	
	/**
	 * 메시지 전송
	 * */
	@PostMapping("/messages")
	public ResponseEntity<ResponseDTO<ChatResponseDTO>> sendMessage(@RequestBody SendMessageRequestDTO req, @AuthenticationPrincipal String email) {
		User authUser = User.getAuthenticatedUser(userRepository);
		if (authUser == null) {
            ResponseDTO<ChatResponseDTO> bad = ResponseDTO.<ChatResponseDTO>builder()
                    .status(HttpStatus.UNAUTHORIZED.value())
                    .message("로그인이 필요합니다.")
                    .data(null)
                    .build();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(bad);
        }
		
		// 유효성 검증
		if (req == null || req.getRoomId() == null || req.getSenderId() == null) {
			ResponseDTO<ChatResponseDTO> bad = ResponseDTO.<ChatResponseDTO>builder()
					.status(HttpStatus.BAD_REQUEST.value())
					.message("채팅방ID와 전송자ID는 필수값 입니다.")
					.data(null)
					.build();
		}
		
		
		// 채팅방에 알림 저장
		log.info("CHAT: chatContent1: {}", req.getContent());
		List<Notification> notifications = chatRoomService.saveNotification(req.getRoomId(), req.getSenderId(), req.getContent(), NotificationType.CHAT, null);
		
		if (notifications == null || notifications.isEmpty()) {
			ResponseDTO<ChatResponseDTO> err = ResponseDTO.<ChatResponseDTO>builder()
					.status(HttpStatus.INTERNAL_SERVER_ERROR.value())
					.message("메시지 전송 및 알림 생성에 실패했습니다.")
					.data(null)
					.build();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
		}
		
		Chat savedChat = null;
		for (Notification n : notifications) {
			if (n.getChat() != null) {
				savedChat = n.getChat();
				break;
			}
		}

		if  (savedChat == null) {
			 ResponseDTO<ChatResponseDTO> err = ResponseDTO.<ChatResponseDTO>builder()
	                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
	                    .message("채팅 메시지가 올바르지 않습니다.")
	                    .data(null)
	                    .build();
	            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
		}
		
		
		ChatResponseDTO response = ChatResponseDTO.builder()
				.id(savedChat.getId())
				.messageContent(savedChat.getMessageContent())
				.sendAt(savedChat.getSendAt() != null ? savedChat.getSendAt() : LocalDateTime.now())
                .fileYn(savedChat.getFileYn())
                .fileUrl(savedChat.getFileUrl())
                .roomId(savedChat.getChatRoom() != null ? savedChat.getChatRoom().getId() : req.getRoomId())
                .senderId(savedChat.getSender() != null ? savedChat.getSender().getId() : req.getSenderId())
                .senderName(savedChat.getSender() != null ? savedChat.getSender().getName() : null)
                .build();
		
		ResponseDTO<ChatResponseDTO> success = ResponseDTO.<ChatResponseDTO>builder()
                .status(HttpStatus.CREATED.value())
                .message("Message sent")
                .data(response)
                .build();
		
		return ResponseEntity.status(HttpStatus.CREATED).body(success);
		
		
	}
	

	
	
	
	
	
	
}
