package com.goodee.coreconnect.chat.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
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

@RequiredArgsConstructor
@RequestMapping("/api/v1/chat")
@RestController
public class ChatMessageController {


	private final ChatRoomService chatRoomService;
	private final UserRepository userRepository;
	private final ChatRepository chatRepository;
	private final NotificationRepository notificationRepository;
	
	/**
	 * 채팅방 생성
	 * 
	 * */
	@PostMapping("/rooms")
	public ResponseEntity<ResponseDTO<ChatRoomResponseDTO>> createRoom(@RequestBody CreateRoomRequestDTO req) {
//		User authUser = User.getAuthenticatedUser(userRepository);
//        if (authUser == null) {
//            ResponseDTO<ChatRoomResponseDTO> res = ResponseDTO.<ChatRoomResponseDTO>builder()
//                    .status(HttpStatus.UNAUTHORIZED.value())
//                    .message("로그인이 필요합니다.")
//                    .data(null)
//                    .build();
//            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(res);
//        }
//
//        // ensure userIds list exists
//        if (req.getUserIds() == null) {
//            req.setUserIds(List.of());
//        }
//
//        // make sure creator is included in participants
//        if (!req.getUserIds().contains(authUser.getId())) {
//            req.getUserIds().add(authUser.getId());
//        }
		
		
		
		ChatRoom created = chatRoomService.createChatRoom(req.getRoomName(), req.getUserIds());
		ChatRoomResponseDTO dto = ChatRoomResponseDTO.fromEntity(created);
		ResponseDTO<ChatRoomResponseDTO> res = ResponseDTO.<ChatRoomResponseDTO>builder()
				.status(HttpStatus.CREATED.value())
				.message("채팅방이 생성 되었습니다")
				.data(dto)
				.build();
		return ResponseEntity.status(HttpStatus.CREATED).body(res);		
	}
	
	/**
	 * 메시지 전송
	 * */
	@PostMapping("/messages")
	public ResponseEntity<ResponseDTO<ChatResponseDTO>> sendMessage(@RequestBody SendMessageRequestDTO req) {
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
