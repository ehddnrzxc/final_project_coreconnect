package com.goodee.coreconnect.chat.controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import io.jsonwebtoken.io.IOException;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.chat.dto.request.CreateRoomRequestDTO;
import com.goodee.coreconnect.chat.dto.request.InviteUsersRequestDTO;
import com.goodee.coreconnect.chat.dto.request.PushNotificationTestRequestDTO;
import com.goodee.coreconnect.chat.dto.request.SendMessageRequestDTO;
import com.goodee.coreconnect.chat.dto.response.ChatMessageResponseDTO;
import com.goodee.coreconnect.chat.dto.response.ChatMessageSenderTypeResponseDTO;
import com.goodee.coreconnect.chat.dto.response.ChatResponseDTO;
import com.goodee.coreconnect.chat.dto.response.ChatRoomResponseDTO;
import com.goodee.coreconnect.chat.dto.response.ChatUnreadCountDTO;
import com.goodee.coreconnect.chat.dto.response.ChatUserResponseDTO;
import com.goodee.coreconnect.chat.dto.response.NotificationReadResponseDTO;
import com.goodee.coreconnect.chat.dto.response.ReplyMessageRequestDTO;
import com.goodee.coreconnect.chat.dto.response.UnreadNotificationSummaryDTO;
import com.goodee.coreconnect.chat.entity.Chat;
import com.goodee.coreconnect.chat.entity.ChatRoom;
import com.goodee.coreconnect.chat.entity.ChatRoomUser;
import com.goodee.coreconnect.chat.entity.MessageFile;
import com.goodee.coreconnect.chat.repository.ChatRepository;
import com.goodee.coreconnect.chat.repository.ChatRoomUserRepository;
import com.goodee.coreconnect.chat.repository.MessageFileRepository;
import com.goodee.coreconnect.chat.repository.NotificationRepository;
import com.goodee.coreconnect.chat.service.ChatRoomService;
import com.goodee.coreconnect.common.S3Service;
import com.goodee.coreconnect.common.dto.response.ResponseDTO;
import com.goodee.coreconnect.common.entity.Notification;
import com.goodee.coreconnect.common.notification.dto.NotificationDTO;
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
    private final S3Service s3Service;
	
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
	
	/**
	 * 7. 메시지 답신
	 * */
	@Operation(summary = "메시지 답신 전송", description="특정 메시지에 답신을 전송합니다.")
	@PostMapping("/{roomId}/messages/reply")
	public ResponseEntity<ResponseDTO<ChatResponseDTO>> replyToMessage(@PathVariable("roomId") Integer roomId, @AuthenticationPrincipal String email, @RequestBody ReplyMessageRequestDTO req) {
		User sender = userRepository.findByEmail(email).orElseThrow();
		Chat replyChat = chatRoomService.sendChatMessage(roomId, sender.getId(), req.getReplyContent());
		if (replyChat == null) {
			ChatResponseDTO.fromEntity(replyChat);
		}
		ChatResponseDTO dto = ChatResponseDTO.fromEntity(replyChat);
		return ResponseEntity.status(HttpStatus.CREATED).body(ResponseDTO.success(dto, "답신 메시지 저장 성공"));		
	}
	
	
	/**
	 * 8. 파일/이미지 업로드 및 미리보기
	 * @throws java.io.IOException 
	 * */
	@Operation(summary = "채팅방 파일/이미지 업로드", description = "채팅방에 파일/이미지를 업로드합니다")
	@PostMapping("/{roomId}/messages/file")
	public ResponseEntity<ResponseDTO<ChatResponseDTO>> uploadFileMessage(@PathVariable("roomId") Integer roomId, @AuthenticationPrincipal String email, @RequestParam("file") MultipartFile uploadFile) throws java.io.IOException {
		User sender = userRepository.findByEmail(email).orElseThrow();
		String s3Key;
		String fileUrl;
		
		try {
			// s3에 업로드
			s3Key = s3Service.uploadProfileImage(uploadFile, sender.getName());
			fileUrl = s3Service.getFileUrl(s3Key);
			
		} catch (IOException e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(ResponseDTO.internalError("파일 s3 업로드 실패: "+ e.getMessage()));
		}		
		
		MessageFile fileEntity = MessageFile.createMessageFile(
	                uploadFile.getOriginalFilename(),
	                (double) uploadFile.getSize(),
	                fileUrl,
	                null // chat은 sendChatMessage에서 연결됨
	     );
		// fileUrl은 chat의 fileUrl 필드로도 저장해줄 수 있음
		Chat chat = chatRoomService.sendChatMessage(roomId, sender.getId(), fileEntity);
		if (chat == null) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(ResponseDTO.internalError("파일 메시지 저장 실패"));
		}
		messageFileRepository.save(fileEntity);
		ChatResponseDTO dto = ChatResponseDTO.fromEntity(chat);
		// fileUrl도 DTO에 포함
		dto.setFileUrl(fileUrl);
		return ResponseEntity.status(HttpStatus.CREATED).body(ResponseDTO.success(dto, "파일/이미지 업로드 성공"));
	}
	
	  // 9. 채팅방 초대/참여
    @Operation(summary = "채팅방에 사용자 초대", description = "채팅방에 사용자를 초대하고 참여 메시지를 전송합니다.")
    @PostMapping("/{roomId}/invite")
    public ResponseEntity<ResponseDTO<List<ChatUserResponseDTO>>> inviteUsersToChatRoom(
            @PathVariable("roomId") Integer roomId,
            @RequestBody InviteUsersRequestDTO req
    ) {
        ChatRoom chatRoom = chatRoomService.findById(roomId);
        List<Integer> participantIds = chatRoomService.getParticipantIds(roomId);
        List<User> nonParticipants = userRepository.findAll()
                .stream().filter(u -> !participantIds.contains(u.getId())).collect(Collectors.toList());
        List<User> invitedUsers = nonParticipants.stream()
                .filter(u -> req.getUserIds().contains(u.getId()))
                .collect(Collectors.toList());

        for (User invited : invitedUsers) {
            ChatRoomUser cru = ChatRoomUser.createChatRoomUser(invited, chatRoom);
            chatRoomUserRepository.save(cru);
            String joinMsg = invited.getName() + "의 사용자가 채팅방에 참여했습니다";
            chatRoomService.sendChatMessage(roomId, invited.getId(), joinMsg);
        }
        List<ChatUserResponseDTO> dtoList = invitedUsers.stream().map(ChatUserResponseDTO::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(ResponseDTO.success(dtoList, "초대 및 참여 메시지 저장 성공"));
    }
    

    // 10. 알림 읽음 처리 (채팅/업무)
    @Operation(summary = "알림 읽음 처리", description = "알림을 읽음 처리합니다.")
    @PutMapping("/notifications/{notificationId}/read")
    public ResponseEntity<ResponseDTO<NotificationReadResponseDTO>> markNotificationRead(
            @PathVariable("notificationId") Integer notificationId,
            @AuthenticationPrincipal String email
    ) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("알림 없음: " + notificationId));
        notification.markRead();
        notificationRepository.save(notification);
        NotificationReadResponseDTO dto = new NotificationReadResponseDTO(notification.getId(), notification.getNotificationReadYn());
        return ResponseEntity.ok(ResponseDTO.success(dto, "알림 읽음 처리 성공"));
    }

    // 11. 미읽은 알림/채팅 메시지 요약
    @Operation(summary = "미읽은 알림 요약", description = "가장 최근 알림만 띄우고 알림 개수 표시")
    @GetMapping("/notifications/unread")
    public ResponseEntity<ResponseDTO<UnreadNotificationSummaryDTO>> getLatestUnreadNotificationSummary(
            @AuthenticationPrincipal String email
    ) {
        User user = userRepository.findByEmail(email).orElseThrow();
        List<NotificationType> allowedTypes = List.of(NotificationType.EMAIL, NotificationType.NOTICE, NotificationType.APPROVAL, NotificationType.SCHEDULE);
        List<Notification> unreadNotifications = notificationRepository.findUnreadByUserIdAndTypes(user.getId(), allowedTypes);
        List<Notification> filtered = unreadNotifications.stream()
                .filter(n -> allowedTypes.contains(n.getNotificationType()))
                .sorted(Comparator.comparing(Notification::getNotificationSentAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .toList();
        int unreadCount = filtered.size();
        Notification latest = filtered.isEmpty() ? null : filtered.get(0);
        UnreadNotificationSummaryDTO dto = UnreadNotificationSummaryDTO.from(latest, unreadCount);
        return ResponseEntity.ok(ResponseDTO.success(dto, "미읽은 알림 요약 조회 성공"));
    }
    
    
    // 13. 실시간 알림 WebSocket 푸시 테스트
    @Operation(summary = "실시간 알림 WebSocket 푸시 테스트", description = "WebSocket을 통해 실시간 알림을 테스트합니다.")
    @PostMapping("/notifications/push-test")
    public ResponseEntity<ResponseDTO<String>> pushNotificationTest(
            @AuthenticationPrincipal String email,
            @RequestBody PushNotificationTestRequestDTO req
    ) {
        User user = userRepository.findByEmail(email).orElseThrow();
        notificationService.sendNotification(
                user.getId(),
                NotificationType.EMAIL,
                req.getMessage(),
                null, null,
                user.getId(),
                user.getName()
        );
        return ResponseEntity.ok(ResponseDTO.success("푸시 테스트 성공", "알림 푸시 테스트 완료"));
    }
    
    // 14. 내가 참여중인 채팅방들의 마지막 메시지만 조회
    @Operation(summary = "내가 참여중인 채팅방들의 마지막 메시지만 조회", description = "내가 참여중인 채팅방들의 마지막 메시지만 조회")
    @GetMapping("/rooms/messages/latest")
    public ResponseEntity<ResponseDTO<List<ChatMessageResponseDTO>>> getLatestMessages(@AuthenticationPrincipal String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        List<Chat> latestChats = chatRoomService.getLatestMessagesByUserId(user.getId());
        List<ChatMessageResponseDTO> dtoList = latestChats.stream()
                .map(ChatMessageResponseDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ResponseDTO.success(dtoList, "내 채팅방별 마지막 메시지 조회 성공"));
    }

    // 15. 내가 참여중인 채팅방에서 각 메시지별 읽지 않은 인원 수 표시
    @Operation(summary = "내가 참여중인 채팅방에서 각 메시지별 읽지 않은 인원 수 표시", description = "내가 참여중인 채팅방에서 각 메시지별 읽지 않은 인원 수 표시")
    @GetMapping("/rooms/{roomId}/messages/unread-count")
    public ResponseEntity<ResponseDTO<List<ChatUnreadCountDTO>>> getUnreadCounts(@PathVariable("roomId") Integer roomId) {
        List<Object[]> unreadCounts = chatRoomService.countUnreadByRoomId(roomId);
        List<ChatUnreadCountDTO> dtoList = unreadCounts.stream()
            .map(arr -> new ChatUnreadCountDTO((Integer) arr[0], ((Long) arr[1]).intValue()))
            .collect(Collectors.toList());
        return ResponseEntity.ok(ResponseDTO.success(dtoList, "채팅방별 메시지 미읽은 인원 수"));
    }

    // 16. 채팅 메시지 전송시 알림 발송
    @Operation(summary = "채팅 메시지 전송시 알림 발송", description = "채팅 메시지 전송시 알림 발송")
    @PostMapping("/rooms/{roomId}/messages")
    public ResponseEntity<ResponseDTO<ChatResponseDTO>> sendChatMessageAndNotify(
            @PathVariable Integer roomId,
            @AuthenticationPrincipal String email,
            @RequestBody SendMessageRequestDTO req
    ) {
        User sender = userRepository.findByEmail(email).orElseThrow();
        Chat chat = chatRoomService.sendChatMessage(roomId, sender.getId(), req.getContent());
        // 서비스 내에서 알림 발송도 처리
        ChatResponseDTO dto = ChatResponseDTO.fromEntity(chat);
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseDTO.success(dto, "메시지 전송 및 알림 발송 성공"));
    }

    // 4. 나에게 온 알림만 조회
    @Operation(summary = " 나에게 온 알림만 조회", description = " 나에게 온 알림만 조회")
    @GetMapping("/notifications")
    public ResponseEntity<ResponseDTO<List<NotificationDTO>>> getMyNotifications(@AuthenticationPrincipal String email) {
    	User user = userRepository.findByEmail(email).orElseThrow();
        List<Notification> notifications = chatRoomService.getNotificationsByUserId(user.getId());
        
        // Notification 엔티티를 DTO로 변환
        List<NotificationDTO> dtoList = notifications.stream()
            .map(n -> {
                NotificationDTO dto = new NotificationDTO();
                dto.setId(n.getId());
                dto.setMessage(n.getNotificationMessage());
                dto.setNotificationType(n.getNotificationType().name());
                dto.setSentAt(n.getNotificationSentAt());
                return dto;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(ResponseDTO.success(dtoList, "나에게 온 알림 조회 성공"));
    }
    
    
    
}
