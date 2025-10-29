package com.goodee.coreconnect.chat.controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.chat.dto.request.CreateRoomRequestDTO;
import com.goodee.coreconnect.chat.dto.request.SendMessageRequestDTO;
import com.goodee.coreconnect.chat.dto.response.ChatMessageResponseDTO;
import com.goodee.coreconnect.chat.dto.response.ChatResponseDTO;
import com.goodee.coreconnect.chat.dto.response.ChatRoomResponseDTO;
import com.goodee.coreconnect.chat.dto.response.ChatUserResponseDTO;
import com.goodee.coreconnect.chat.dto.response.NotificationReadResponseDTO;
import com.goodee.coreconnect.chat.entity.Chat;
import com.goodee.coreconnect.chat.entity.ChatRoom;
import com.goodee.coreconnect.chat.entity.ChatRoomUser;
import com.goodee.coreconnect.chat.repository.ChatRepository;
import com.goodee.coreconnect.chat.repository.NotificationRepository;
import com.goodee.coreconnect.chat.service.ChatRoomService;
import com.goodee.coreconnect.common.dto.response.ResponseDTO;
import com.goodee.coreconnect.common.entity.Notification;
import com.goodee.coreconnect.common.notification.enums.NotificationType;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Tag(name = "Chat API", description = "채팅 관련 기능 API")
@Slf4j
@RequiredArgsConstructor
@RequestMapping("/api/v1/chat")
@RestController
@SecurityRequirement(name = "bearerAuth") // 이게 핵심!
public class ChatMessageController {


	private final ChatRoomService chatRoomService;
	private final UserRepository userRepository;
	private final ChatRepository chatRepository;
	private final NotificationRepository notificationRepository;
	
	@Operation(summary = "채팅방 생성", description = "새로운 채팅방을 생성합니다.")
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
	@Operation(summary = "채팅 메시지 전송", description = "채팅 메시지를 전송하고 알림을 생성합니다.")
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
	

	/**
	 * 채팅방에서 사용자 목록 조회
	 * 
	 * */
	@Operation(summary = "채팅방에 참여시킬 사용자 목록 조회", description = "채팅방에 참여시킬 사용자 목록을 반환합니다.")
	@GetMapping("/{roomId}")
	public ResponseEntity<List<ChatUserResponseDTO>> getChatRoomUsers(@PathVariable("roomId") Integer roomId,  @AuthenticationPrincipal String email) {
		List<ChatRoomUser> chatRoomUsers = chatRoomService.getChatRoomUsers(roomId);
		List<ChatUserResponseDTO> usersDTO = chatRoomUsers.stream()
			    .filter(cru -> cru.getUser() != null)
			    .map(cru -> new ChatUserResponseDTO(
			        cru.getUser().getId(),
			        cru.getUser().getName(),
			        cru.getUser().getEmail()))
			    .collect(Collectors.toList());
		
		
		
		ResponseDTO<List<ChatUserResponseDTO>> success = ResponseDTO.<List<ChatUserResponseDTO>>builder()
				.status(HttpStatus.CREATED.value())
				.message("채팅방 사용자 조회 성공")
				.data(usersDTO)
				.build();
			
		return ResponseEntity.ok(usersDTO);
	}
	
	
	/**
	 * 내가 참여중인 채팅방에 올라온 채팅메시지 전부 조회
	 * 
	 * 
	 * 
	 * */
	@Operation(summary = "내가 참여중인 채팅방 메시지 전체 조회", description = "내가 참여중인 모든 채팅방의 메시지를 조회합니다.")
	@GetMapping
	public ResponseEntity<List<ChatMessageResponseDTO>> getMyChatMessages(@AuthenticationPrincipal String email) {
		User user	 = userRepository.findByEmail(email).orElseThrow();		
		List<Integer> roomIds = chatRoomService.getChatRoomIdsByUserId(user.getId());
        List<Chat> chats = chatRepository.findByChatRoomIds(roomIds);
        List<ChatMessageResponseDTO> dtoList = chats.stream().map(chat -> ChatMessageResponseDTO.builder()
                .id(chat.getId())
                .messageContent(chat.getMessageContent())
                .sendAt(chat.getSendAt())
                .fileYn(chat.getFileYn())
                .fileUrl(chat.getFileUrl())
                .roomId(chat.getChatRoom().getId())
                .senderId(chat.getSender().getId())
                .senderName(chat.getSender().getName())
                .build()).collect(Collectors.toList());
        return ResponseEntity.ok(dtoList);
		
		
		
	}
	
	
	
	
	
	
	
	
	/**
	 * 채팅메시지 알림 조회시 읽음 처리
	 * 
	 * 
	 * */
	@Operation(summary = "채팅 메시지 알림 읽음 처리", description = "알림을 읽음 처리 합니다.")
	@PutMapping("/{notificationId}")
	public ResponseEntity<NotificationReadResponseDTO> markNotificationRead(@PathVariable("notificationId") Integer notificationId, @AuthenticationPrincipal String email) {
		Notification notification = notificationRepository.findById(notificationId)
				.orElseThrow(() -> new IllegalArgumentException("알림 없음: " + notificationId));
		notification.markRead();
		notificationRepository.save(notification);
	    return ResponseEntity.ok(new NotificationReadResponseDTO(notification.getId(), notification.getNotificationReadYn()));
		
		
		
		
		
	}
	
	
	
	
}
