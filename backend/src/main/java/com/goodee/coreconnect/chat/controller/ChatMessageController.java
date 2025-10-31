package com.goodee.coreconnect.chat.controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Comparator;
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
import com.goodee.coreconnect.chat.dto.response.ChatMessageSenderTypeResponseDTO;
import com.goodee.coreconnect.chat.dto.response.ChatResponseDTO;
import com.goodee.coreconnect.chat.dto.response.ChatRoomResponseDTO;
import com.goodee.coreconnect.chat.dto.response.ChatUserResponseDTO;
import com.goodee.coreconnect.chat.dto.response.NotificationReadResponseDTO;
import com.goodee.coreconnect.chat.entity.Chat;
import com.goodee.coreconnect.chat.entity.ChatRoom;
import com.goodee.coreconnect.chat.entity.ChatRoomUser;
import com.goodee.coreconnect.chat.repository.ChatRepository;
import com.goodee.coreconnect.chat.repository.ChatRoomUserRepository;
import com.goodee.coreconnect.chat.repository.MessageFileRepository;
import com.goodee.coreconnect.chat.repository.NotificationRepository;
import com.goodee.coreconnect.chat.service.ChatRoomService;
import com.goodee.coreconnect.common.dto.response.ResponseDTO;
import com.goodee.coreconnect.common.entity.Notification;
import com.goodee.coreconnect.common.notification.enums.NotificationType;
import com.goodee.coreconnect.common.notification.service.NotificationService;
import com.goodee.coreconnect.common.notification.service.WebSocketDeliveryService;
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
    private final ChatRoomUserRepository chatRoomUserRepository;
    private final MessageFileRepository messageFileRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final WebSocketDeliveryService webSocketDeliveryService;
	
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
		// 인증 사용자 조회
		User authUser = userRepository.findByEmail(email).orElse(null);
		// 인증 실패
		if (authUser == null) {
			 ResponseDTO<ChatResponseDTO> bad = ResponseDTO.<ChatResponseDTO>builder()
                    .status(HttpStatus.UNAUTHORIZED.value())
                    .message("로그인이 필요합니다.")
                    .data(null)
                    .build();
             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(bad); // 401 반환
		}
			
		// 유효성 검증
		if (req == null || req.getRoomId() == null || req.getSenderId() == null) { // 필수값 체크
			ResponseDTO<ChatResponseDTO> bad = ResponseDTO.<ChatResponseDTO>builder()
					.status(HttpStatus.BAD_REQUEST.value())
					.message("채팅방ID와 전송자ID는 필수값 입니다.")
					.data(null)
					.build();
			return ResponseEntity.badRequest().body(bad); // 400 반환
		}
	
		// 채팅 저장
		Chat savedChat = chatRoomService.sendChatMessage(req.getRoomId(), req.getSenderId(), req.getContent());
	
		// 저장 실패
		if (savedChat == null) {
			ResponseDTO<ChatResponseDTO> err = ResponseDTO.<ChatResponseDTO>builder()
					.status(HttpStatus.INTERNAL_SERVER_ERROR.value())
					.message("채팅 메시지가 올바르지 않습니다.")
					.data(null)
					.build();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err); // 500 반환
		}
		
		// 응답 DTO 생성
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
			
		// 성공 응답 DTO 생성
		ResponseDTO<ChatResponseDTO> success = ResponseDTO.<ChatResponseDTO>builder() // 성공 응답 DTO 생성
            .status(HttpStatus.CREATED.value())
            .message("Message sent")
            .data(response)
            .build();
		
		return ResponseEntity.status(HttpStatus.CREATED).body(success); // 성공 응답 반환
	}
	

	/**
	 * 3. 채팅방 참여자 목록 조회
	 * 
	 * */
	@Operation(summary = "채팅방 참여자 목록 조회", description = "채팅방에 참여중인 사용자 목록을 반환합니다.")
	@GetMapping("/{roomId}/users")
	public ResponseEntity<ResponseDTO<List<ChatUserResponseDTO>>> getChatRoomUsers(@PathVariable("roomId") Integer roomId) {
		List<ChatRoomUser> chatRoomUsers = chatRoomService.getChatRoomUsers(roomId);
		List<ChatUserResponseDTO> usersDTO = chatRoomUsers.stream()
                .filter(cru -> cru.getUser() != null)
                .map(ChatUserResponseDTO::fromEntity)
                .collect(Collectors.toList());
		
		return ResponseEntity.ok(ResponseDTO.success(usersDTO, "채팅방 사용자 조회 성공"));
	}
	
	/**
	 * 4. 내가 참여중인 채팅방 메시지 전체 조회
	 * 
	 * */
	@Operation(summary = "내가 참여중인 채팅방 메시지 전체 조회", description = "내가 참여중인 모든 채팅방의 메시지를 조회합니다.")
	@GetMapping("/messages")
	public ResponseEntity<ResponseDTO<List<ChatMessageResponseDTO>>> getMyChatMessages(@AuthenticationPrincipal String email) {
		User user = userRepository.findByEmail(email).orElseThrow();
		List<Integer> roomIds = chatRoomService.getChatRoomIdsByUserId(user.getId());
		List<Chat> chats = chatRepository.findByChatRoomIds(roomIds);
		List<ChatMessageResponseDTO> dtoList = chats.stream()
	                .map(ChatMessageResponseDTO::fromEntity)
	                .collect(Collectors.toList());
		return ResponseEntity.ok(ResponseDTO.success(dtoList, "내 채팅방 메시지 조회 성공"));
	}
	
	
	/**
	 * 5. 내가 접속한 채팅방에 모든 메시지 날짜 오름차순 조회
	 * 
	 * */
	@Operation(summary = "채팅방의 메시지 조회(오름차순)", description = "선택한 채팅방의 메시지를 날짜 기준 오름차순으로 정렬해 조회합니다.")
	@GetMapping("/{roomId}/messages")
	public ResponseEntity<ResponseDTO<List<ChatMessageResponseDTO>>> getChatRoomMessagesByChatRoomId(@PathVariable("roomId") Integer roomId) {
		ChatRoom chatRoom = chatRoomService.findById(roomId);
		List<Chat> messages = chatRoom.getChats();
		messages.sort(Comparator.comparing(Chat::getSendAt));
		List<ChatMessageResponseDTO> dtoList = messages.stream()
				.map(ChatMessageResponseDTO::fromEntity)
				.collect(Collectors.toList());
		return ResponseEntity.ok(ResponseDTO.success(dtoList, "채팅방 메시지 오름차순 조회 성공"));
	}
	
	/**
	 * 6. 채팅 메시지 정렬(내꺼/남의꺼)
	 * */
	@Operation(summary = "채팅 메시지 내/남 구분", description = "선택한 채팅방의 메시지를 내/다른 사람 메시지로 구분하여 조회합니다.")
    @GetMapping("/{roomId}/messages/sender")
    public ResponseEntity<ResponseDTO<List<ChatMessageSenderTypeResponseDTO>>> getChatRoomMessagesWithSenderType(
            @PathVariable("roomId") Integer roomId,
            @AuthenticationPrincipal String email
    ) {
        User user = userRepository.findByEmail(email).orElseThrow();
        ChatRoom chatRoom = chatRoomService.findById(roomId);
        List<Chat> messages = chatRoom.getChats();
        messages.sort(Comparator.comparing(Chat::getSendAt));
        List<ChatMessageSenderTypeResponseDTO> dtoList = messages.stream()
                .map(chat -> ChatMessageSenderTypeResponseDTO.fromEntity(chat, user.getId()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ResponseDTO.success(dtoList, "내/남 메시지 구분 조회 성공"));
    }
	
	

	
}
