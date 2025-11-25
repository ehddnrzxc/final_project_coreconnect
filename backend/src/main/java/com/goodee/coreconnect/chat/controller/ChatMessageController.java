package com.goodee.coreconnect.chat.controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import java.io.IOException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.chat.dto.request.CreateRoomRequestDTO;
import com.goodee.coreconnect.chat.dto.request.InviteUsersRequestDTO;
import com.goodee.coreconnect.chat.dto.request.PushNotificationTestRequestDTO;
import com.goodee.coreconnect.chat.dto.request.SendMessageRequestDTO;
import com.goodee.coreconnect.chat.dto.response.ChatMessageResponseDTO;
import com.goodee.coreconnect.chat.dto.response.ChatMessageSenderTypeResponseDTO;
import com.goodee.coreconnect.chat.dto.response.ChatResponseDTO;
import com.goodee.coreconnect.chat.dto.response.ChatRoomLatestMessageResponseDTO;
import com.goodee.coreconnect.chat.dto.response.ChatRoomListDTO;
import com.goodee.coreconnect.chat.dto.response.ChatRoomResponseDTO;
import com.goodee.coreconnect.chat.dto.response.ChatUnreadCountDTO;
import com.goodee.coreconnect.chat.dto.response.ChatUserResponseDTO;
import com.goodee.coreconnect.chat.dto.response.NotificationReadResponseDTO;
import com.goodee.coreconnect.chat.dto.response.ReplyMessageRequestDTO;
import com.goodee.coreconnect.chat.dto.response.UnreadNotificationListDTO;
import com.goodee.coreconnect.chat.dto.response.UnreadNotificationSummaryDTO;
import com.goodee.coreconnect.chat.entity.Chat;
import com.goodee.coreconnect.chat.entity.ChatMessageReadStatus;
import com.goodee.coreconnect.chat.entity.ChatRoom;
import com.goodee.coreconnect.chat.entity.ChatRoomUser;
import com.goodee.coreconnect.chat.entity.MessageFile;
import com.goodee.coreconnect.chat.repository.ChatMessageReadStatusRepository;
import com.goodee.coreconnect.chat.repository.ChatRepository;
import com.goodee.coreconnect.chat.repository.ChatRoomUserRepository;
import com.goodee.coreconnect.chat.repository.MessageFileRepository;
import com.goodee.coreconnect.chat.repository.NotificationRepository;
import com.goodee.coreconnect.chat.service.ChatRoomService;
import com.goodee.coreconnect.common.dto.response.ResponseDTO;
import com.goodee.coreconnect.common.entity.Notification;
import com.goodee.coreconnect.common.exception.ChatNotFoundException;
import com.goodee.coreconnect.common.notification.dto.NotificationDTO;
import com.goodee.coreconnect.common.notification.enums.NotificationType;
import com.goodee.coreconnect.common.notification.service.NotificationService;
import com.goodee.coreconnect.common.notification.service.WebSocketDeliveryService;
import com.goodee.coreconnect.common.service.S3Service;
import com.goodee.coreconnect.security.userdetails.CustomUserDetails;
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
    private final ChatMessageReadStatusRepository chatMessageReadStatusRepository;
    private final NotificationService notificationService;
    private final WebSocketDeliveryService webSocketDeliveryService;
    private final S3Service s3Service;
    private final SimpMessagingTemplate messagingTemplate;
	
	@Operation(summary = "채팅방 생성", description = "새로운 채팅방을 생성합니다.")
	@PostMapping
    public ResponseEntity<ChatRoomResponseDTO> createChatRoom(
    		Principal principal, 
            @RequestBody CreateRoomRequestDTO request
    		
    		) {  // 2. 방 이름, 초대할 ID 목록
		log.info("채팅방 정보: {}", request.toString());
        String creatorEmail = principal.getName();
        // 서비스를 호출할 때 로그인한 사용자 정보(creatorEmail)를 넘겨줍니다.
        ChatRoom newChatRoom = chatRoomService.createChatRoom(request.getRoomName(), request.getUserIds(), creatorEmail);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(ChatRoomResponseDTO.fromEntity(newChatRoom));
    }
	/**
	 * 메시지 전송
	 */
	@Operation(summary = "채팅 메시지 전송", description = "채팅 메시지를 전송하고 알림을 생성합니다.")
	@MessageMapping("/chat.sendMessage") // 프론트에서 /app/chat.sendMessage로 메시지 전송 (STOMP)
	@org.springframework.transaction.annotation.Transactional // ⭐ LazyInitializationException 방지: 트랜잭션 유지
	public void sendMessage(
	        @Payload SendMessageRequestDTO req,
	        SimpMessageHeaderAccessor headerAccessor
	) {
	    // ⭐ 함수 진입 로그 (최우선 확인)
	    log.info("🔥 [sendMessage] ========== 함수 진입 ========== - req: {}, headerAccessor: {}", 
	            req, headerAccessor != null ? "not null" : "null");
	    
	    try {
	        log.info("[sendMessage] 메시지 수신 시작 - req: {}", req);
	        
	        // WebSocket 세션에서 사용자 이메일 가져오기 (WebSocketAuthInterceptor에서 설정)
	        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
	        if (sessionAttributes == null) {
	            log.warn("[ChatMessageController] sendMessage - 세션 attributes가 null입니다.");
	            return;
	        }
	        String email = (String) sessionAttributes.get("wsUserEmail");
	        if (email == null || email.isBlank()) {
	            log.warn("[ChatMessageController] sendMessage - 세션에 사용자 이메일이 없습니다.");
	            return;
	        }
	        log.info("[sendMessage] 사용자 이메일 확인 - email: {}", email);

	        // 1. 인증 사용자 체크 (프론트에서 senderId가 아닌, 인증 객체에서 반드시 가져오기)
	        // ⭐ LazyInitializationException 방지: Department를 함께 로드하는 메서드 사용
	        User authUser = userRepository.findByEmailWithDepartment(email).orElse(null);
	        if (authUser == null) {
	            log.error("[ChatMessageController] sendMessage - 사용자를 찾을 수 없습니다. email: {}", email);
	            return;
	        }
	        
	        // ⭐ Department 정보를 즉시 추출하여 변수에 저장 (LazyInitializationException 방지)
	        // @MessageMapping 메서드에서 @Transactional이 제대로 작동하지 않을 수 있으므로
	        // 조회 직후 즉시 Department 정보를 추출
	        String deptName = null;
	        String profileImageKey = null;
	        try {
	            if (authUser.getDepartment() != null) {
	                // ⭐ Department 프록시를 즉시 초기화하여 변수에 저장
	                deptName = authUser.getDepartment().getDeptName();
	                log.debug("[sendMessage] Department 정보 추출 완료 - deptName: {}", deptName);
	            }
	            // ⭐ 프로필 이미지 키도 미리 추출
	            profileImageKey = authUser.getProfileImageKey();
	        } catch (org.hibernate.LazyInitializationException e) {
	            log.error("[sendMessage] LazyInitializationException 발생 - Department 접근 실패: {}", e.getMessage(), e);
	            deptName = null;
	        } catch (Exception e) {
	            log.warn("[sendMessage] 사용자 정보 추출 중 예외 발생 (무시하고 계속 진행): {}", e.getMessage());
	            deptName = null;
	        }
	        
	        log.info("[sendMessage] 인증 사용자 확인 - userId: {}, email: {}, deptName: {}", 
	                authUser.getId(), authUser.getEmail(), deptName);

	        // 2. 유효성 체크 (roomId, content)
	        if (req == null || req.getRoomId() == null || req.getContent() == null || req.getContent().trim().isEmpty()) {
	            log.warn("[ChatMessageController] sendMessage - 필수 데이터 누락 - req: {}, roomId: {}, content: {}", 
	                    req, req != null ? req.getRoomId() : null, req != null ? req.getContent() : null);
	            return;
	        }
	        log.info("[sendMessage] 유효성 체크 통과 - roomId: {}, content 길이: {}", req.getRoomId(), req.getContent().length());

	        //  3. DB 저장 - 반드시 인증 정보에서 senderId 사용!
	        //    (보안상 프론트에서 senderId를 보내지 않음, 무조건 서버 측에서 로그인 사용자의 id 사용)
	        Chat saved = chatRoomService.sendChatMessage(
	            req.getRoomId(),
	            authUser.getId(),    // <-- ★ authUser.getId()로 senderId 대체!
	            req.getContent()
	        );
	        
	        if (saved == null) {
	            log.error("[sendMessage] 메시지 저장 실패 - roomId: {}, senderId: {}, content: {}", 
	                    req.getRoomId(), authUser.getId(), req.getContent());
	            return;
	        }
	        log.info("[sendMessage] 메시지 저장 성공 - chatId: {}, roomId: {}, senderId: {}", 
	                saved.getId(), req.getRoomId(), authUser.getId());

	        // 4. 해당 채널 구독자에게 push (프론트에서 /topic/chat.room.{roomId} 구독 중)
	        // ⭐ LazyInitializationException 방지: fromEntity() 대신 직접 DTO 생성
	        // saved.getSender()는 LAZY이므로 Department 접근 시 에러 발생 가능
	        // 이미 Department가 로드된 authUser를 사용하여 DTO 생성
	        ChatResponseDTO responseDto = new ChatResponseDTO();
	        responseDto.setId(saved.getId());
	        responseDto.setMessageContent(saved.getMessageContent());
	        responseDto.setSendAt(saved.getSendAt() != null ? saved.getSendAt().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")) : null);
	        responseDto.setFileYn(saved.getFileYn());
	        responseDto.setFileUrl(saved.getFileUrl());
	        responseDto.setRoomId(saved.getChatRoom() != null ? saved.getChatRoom().getId() : null);
	        responseDto.setSenderId(authUser.getId());
	        responseDto.setSenderName(authUser.getName());
	        responseDto.setSenderEmail(authUser.getEmail());
	        
	        if (responseDto == null) {
	            log.error("[sendMessage] responseDto가 null입니다 - chatId: {}, roomId: {}", 
	                    saved.getId(), req.getRoomId());
	            return;
	        }
	    
	    // ⭐ unreadCount 실시간 재계산: 브로드캐스트 직전에 항상 DB에서 최신 값 조회
	    // sendChatMessage에서 이미 flush 후 최신 값을 가져왔지만, 브로드캐스트 직전에 다시 한 번 확인
	    // 이렇게 해야 race condition 없이 정확한 unreadCount를 브로드캐스트할 수 있음
	    int realUnreadCount = chatMessageReadStatusRepository.countUnreadByChatId(saved.getId());
	    
	    // ⭐ Chat 엔티티의 unreadCount도 최신 값으로 업데이트 (일관성 유지)
	    if (saved.getUnreadCount() == null || saved.getUnreadCount() != realUnreadCount) {
	        saved.updateUnreadCount(realUnreadCount);
	        chatRepository.save(saved);
	        chatRepository.flush(); // 브로드캐스트 직전에 flush하여 최신 값 확보
	    }
	    
	    // ⭐ 참여자 수 확인 (디버깅용)
	    int participantCount = chatRoomUserRepository.findByChatRoomId(req.getRoomId()).size();
	    
	    // ⭐ 현재 접속 중인 사용자 수 확인 (디버깅용)
	    List<Integer> connectedUserIds = chatRoomService.getConnectedUserIdsInRoom(req.getRoomId());
	    int connectedUsersCount = connectedUserIds.size();
	    
	    log.info("[sendMessage] ⭐ unreadCount 실시간 재계산 - chatId: {}, 참여자수: {}, 접속중인사용자수: {}, 실시간unreadCount: {}", 
	            saved.getId(), participantCount, connectedUsersCount, realUnreadCount);
	    
	    // ⭐ 실시간 계산된 값을 DTO에 설정
	    responseDto.setUnreadCount(realUnreadCount);
	    
	    // ⭐ senderEmail 명시적으로 설정 (lazy loading 문제 해결)
	    // fromEntity에서 chat.getSender().getEmail()이 null일 수 있으므로 authUser.getEmail() 직접 설정
	    responseDto.setSenderEmail(authUser.getEmail());
	    
	    // ⭐ 프로필 이미지 URL, 직급, 부서명 설정 (user_profile_image_key 사용)
	    // ⭐ deptName과 profileImageKey는 이미 위에서 추출했으므로 재사용
	    // ⭐ authUser 객체에 직접 접근하지 않고 미리 추출한 값 사용
	    if (authUser != null) {
	        log.debug("[sendMessage] 프로필 이미지 설정 - userId: {}, email: {}, profileImageKey: {}", 
	                authUser.getId(), authUser.getEmail(), profileImageKey);
	        
	        if (profileImageKey != null && !profileImageKey.isBlank()) {
	            // 프로필 이미지가 있으면 S3 URL 생성
	            String profileImageUrl = s3Service.getFileUrl(profileImageKey);
	            log.info("[sendMessage] 프로필 이미지 URL 생성 성공 - key: {}, url: {}", profileImageKey, profileImageUrl);
	            responseDto.setSenderProfileImageUrl(profileImageUrl);
	        } else {
	            // 프로필 이미지가 없으면 빈 문자열 설정 (프론트엔드에서 기본 이니셜 표시)
	            log.warn("[sendMessage] 프로필 이미지 없음 - userId: {}, email: {}, profileImageKey가 null 또는 빈 문자열", 
	                    authUser.getId(), authUser.getEmail());
	            responseDto.setSenderProfileImageUrl("");
	        }
	        
	        // ⭐ 직급 설정 (authUser에서 직접 가져오기 - JobGrade는 enum이므로 lazy loading 없음)
	        responseDto.setSenderJobGrade(authUser.getJobGrade());
	        
	        // ⭐ 부서명 설정 (미리 추출한 값 사용)
	        responseDto.setSenderDeptName(deptName != null ? deptName : "");
	        log.debug("[sendMessage] 부서명 설정 완료 - deptName: {}", deptName);
	    } else {
	        log.error("[sendMessage] authUser를 찾을 수 없음");
	    }
	    
	    // ⭐ 메시지 브로드캐스트
	    String topic = "/topic/chat.room." + req.getRoomId();
	    
	    // ⭐ responseDto null 체크
	    if (responseDto == null) {
	        log.error("[sendMessage] 브로드캐스트 전 responseDto가 null입니다 - topic: {}", topic);
	        return;
	    }
	    
	    // ⭐ 필수 필드 확인
	    if (responseDto.getId() == null) {
	        log.error("[sendMessage] responseDto.id가 null입니다 - topic: {}, responseDto: {}", topic, responseDto);
	        return;
	    }
	    
	    log.info("[sendMessage] 메시지 브로드캐스트 시작 - topic: {}, responseDto.id: {}, responseDto.messageContent: {}", 
	            topic, responseDto.getId(), responseDto.getMessageContent());
	    
	    try {
	        // ⭐ 1. 메시지 브로드캐스트 (ChatResponseDTO)
	        messagingTemplate.convertAndSend(topic, responseDto);
	        log.info("[sendMessage] 메시지 브로드캐스트 완료 - topic: {}, responseDto.id: {}, unreadCount: {}", 
	                topic, responseDto.getId(), responseDto.getUnreadCount());
	        
	        // ⭐ 2. unreadCount 실시간 업데이트 메시지 브로드캐스트 (필수!)
	        // ⭐ 중요: 메시지 전송 시마다 반드시 UNREAD_COUNT_UPDATE를 브로드캐스트해야 함
	        // ⭐ 이렇게 하면 같은 채팅방에 계속 머물러 있어도 실시간으로 unreadCount가 업데이트됨
	        // ⭐ 접속 중인 사용자들이 읽음 처리되었으므로, 모든 참여자가 실시간으로 unreadCount 업데이트를 받아야 함
	        if (saved != null && saved.getId() != null) {
	            // ⭐ 브로드캐스트 직전에 다시 한 번 최신 값 확인 (race condition 방지)
	            int confirmedUnreadCount = chatMessageReadStatusRepository.countUnreadByChatId(saved.getId());
	            
	            Map<String, Object> unreadCountUpdate = new HashMap<>();
	            unreadCountUpdate.put("type", "UNREAD_COUNT_UPDATE");
	            unreadCountUpdate.put("chatId", saved.getId());
	            unreadCountUpdate.put("unreadCount", confirmedUnreadCount);
	            unreadCountUpdate.put("roomId", req.getRoomId());
	            unreadCountUpdate.put("senderId", authUser.getId());
	            unreadCountUpdate.put("senderEmail", authUser.getEmail());
	            
	            log.info("[sendMessage] ⭐⭐⭐ UNREAD_COUNT_UPDATE 메시지 생성 및 브로드캐스트 시작 ⭐⭐⭐ - chatId: {}, unreadCount: {}, topic: {}, 메시지내용: {}", 
	                    saved.getId(), confirmedUnreadCount, topic, unreadCountUpdate);
	            
	            messagingTemplate.convertAndSend(topic, unreadCountUpdate);
	            
	            log.info("[sendMessage] ⭐⭐⭐ UNREAD_COUNT_UPDATE 브로드캐스트 완료 ⭐⭐⭐ - chatId: {}, unreadCount: {}, topic: {}", 
	                    saved.getId(), confirmedUnreadCount, topic);
	            
	            // ⭐ 3. 채팅방 전체의 unreadCount 업데이트 메시지 브로드캐스트 (채팅방 목록 업데이트용)
	            // ⭐ 각 참여자별로 자신이 읽지 않은 메시지 수를 계산하여 채팅방 topic으로 브로드캐스트
	            // ⭐ 프론트엔드에서 자신의 unreadCount를 계산하도록 roomId와 chatId만 전달
	            // ⭐ 채팅방에 접속 중이 아닌 사용자도 채팅방 목록의 unreadCount를 업데이트할 수 있도록 함
	            Map<String, Object> roomUnreadCountUpdate = new HashMap<>();
	            roomUnreadCountUpdate.put("type", "ROOM_UNREAD_COUNT_UPDATE");
	            roomUnreadCountUpdate.put("roomId", req.getRoomId());
	            roomUnreadCountUpdate.put("chatId", saved.getId()); // 최신 메시지 ID
	            roomUnreadCountUpdate.put("senderId", authUser.getId());
	            roomUnreadCountUpdate.put("senderEmail", authUser.getEmail());
	            
	            // ⭐ 채팅방 topic으로 브로드캐스트 (모든 참여자가 받음)
	            // ⭐ 프론트엔드에서 자신의 unreadCount를 계산하거나, 백엔드 API를 호출하여 가져옴
	            messagingTemplate.convertAndSend(topic, roomUnreadCountUpdate);
	            
	            log.info("[sendMessage] ⭐⭐⭐ ROOM_UNREAD_COUNT_UPDATE 브로드캐스트 완료 ⭐⭐⭐ - roomId: {}, topic: {}", 
	                    req.getRoomId(), topic);
	        } else {
	            log.warn("[sendMessage] ⚠️ saved 또는 saved.getId()가 null이어서 UNREAD_COUNT_UPDATE 브로드캐스트 불가 - saved: {}, saved.getId(): {}", 
	                    saved, saved != null ? saved.getId() : null);
	        }
	    } catch (Exception e) {
	        log.error("[sendMessage] 메시지 브로드캐스트 실패 - topic: {}, error: {}", topic, e.getMessage(), e);
	    }
	    
	    } catch (Exception e) {
	        log.error("🔥 [sendMessage] ========== 예외 발생 ========== - req: {}, error: {}, stackTrace: {}", 
	                req, e.getMessage(), e);
	        e.printStackTrace(); // 스택 트레이스 출력
	        
	        // ⭐ 예외 발생 시 프론트엔드에 에러 알림 전송 (선택사항)
	        try {
	            if (req != null && req.getRoomId() != null) {
	                String errorTopic = "/topic/chat.room." + req.getRoomId();
	                Map<String, Object> errorMessage = new HashMap<>();
	                errorMessage.put("type", "ERROR");
	                errorMessage.put("message", "메시지 전송 중 오류가 발생했습니다: " + e.getMessage());
	                messagingTemplate.convertAndSend(errorTopic, errorMessage);
	                log.info("[sendMessage] 에러 메시지 브로드캐스트 완료 - topic: {}", errorTopic);
	            }
	        } catch (Exception broadcastError) {
	            log.error("[sendMessage] 에러 메시지 브로드캐스트 실패: {}", broadcastError.getMessage());
	        }
	    }
	    // 보통 REST ResponseEntity를 반환하지 않고 void로 처리 (비동기 WebSocket용)
	    // 필요하다면 별도의 Error 메시지를 특정 유저에게만 전송하도록 커스텀도 가능
	}

	/**
	 * 3. 채팅방 참여자 목록 조회
	 * 
	 * */
	@Operation(summary = "채팅방 참여자 목록 조회", description = "채팅방에 참여중인 사용자 목록을 반환합니다.")
	@GetMapping("/{roomId}/users")
	public ResponseEntity<ResponseDTO<List<ChatUserResponseDTO>>> getChatRoomUsers(@PathVariable("roomId") Integer roomId) {
		List<ChatRoomUser> chatRoomUsers = chatRoomService.getChatRoomUsers(roomId);
		// ⭐ S3Service를 파라미터로 전달하여 fromEntity에서 직접 profileImageUrl 변환
		List<ChatUserResponseDTO> usersDTO = chatRoomUsers.stream()
                .filter(cru -> cru.getUser() != null)
                .map(cru -> {
                    // ⭐ 핵심: S3Service를 파라미터로 전달하여 fromEntity에서 profileImageKey → S3 URL 변환
                    ChatUserResponseDTO dto = ChatUserResponseDTO.fromEntity(cru, s3Service);
                    
                    // ⭐ 디버깅: DTO 필드 값 확인
                    if (dto != null && cru.getUser() != null) {
                        User user = cru.getUser();
                        log.info("[getChatRoomUsers] DTO 생성 완료 - userId: {}, name: {}, email: {}, jobGrade: {}, deptName: {}, profileImageUrl: {}", 
                                user.getId(), dto.getName(), dto.getEmail(), dto.getJobGrade(), dto.getDeptName(), 
                                dto.getProfileImageUrl() != null && !dto.getProfileImageUrl().isEmpty() 
                                    ? dto.getProfileImageUrl().substring(0, Math.min(50, dto.getProfileImageUrl().length())) + "..." 
                                    : "빈 문자열");
                    }
                    
                    return dto;
                })
                .filter(dto -> dto != null) // null 체크
                .collect(Collectors.toList());
		
		// ⚠️ 디버깅: 최종 응답 DTO 리스트 확인
		log.info("[getChatRoomUsers] 최종 응답 DTO 개수: {}", usersDTO.size());
		for (ChatUserResponseDTO dto : usersDTO) {
		    log.info("[getChatRoomUsers] 응답 DTO - id: {}, name: {}, profileImageUrl: {}", 
		            dto.getId(), dto.getName(), 
		            dto.getProfileImageUrl() != null && !dto.getProfileImageUrl().isEmpty() 
		                ? dto.getProfileImageUrl().substring(0, Math.min(50, dto.getProfileImageUrl().length())) + "..." 
		                : "빈 문자열 또는 null");
		}
		
		return ResponseEntity.ok(ResponseDTO.success(usersDTO, "채팅방 사용자 조회 성공"));
	}
	
	/**
	 * 4. 내가 참여중인 채팅방 메시지 전체 조회
	 * 
	 * */
	@Operation(summary = "내가 참여중인 채팅방 메시지 전체 조회", description = "내가 참여중인 모든 채팅방의 메시지를 조회합니다.")
	@GetMapping("/messages")
	public ResponseEntity<ResponseDTO<List<ChatMessageResponseDTO>>> getMyChatMessages(@AuthenticationPrincipal CustomUserDetails customUserDetails) {
	  String email = customUserDetails.getEmail();
		User user = userRepository.findByEmail(email).orElseThrow();

	    // 1. 내가 참여중인 채팅방 정보 리스트(DTO) 가져오기
	    List<ChatRoomLatestMessageResponseDTO> roomDtoList = chatRoomService.getChatRoomIdsByUserId(user.getId());

	    // 2. roomId만 추출
	    List<Integer> roomIds = roomDtoList.stream()
	        .map(ChatRoomLatestMessageResponseDTO::getRoomId)
	        .collect(Collectors.toList());

	    // 3. roomId로 전체 채팅 메시지 조회
	    List<Chat> chats = chatRepository.findByChatRoomIds(roomIds);

	    // 4. 채팅 메시지 DTO 변환
	    List<ChatMessageResponseDTO> chatDtoList = chats.stream()
	    		.map(chat -> {
	    			// 현재 로그인 사용자(user)의 각가 메시지(chat)에 대해 읽음상태 혹은 false 기준 조회
	    			Optional<ChatMessageReadStatus> readStatusOpt = 
	    					chatMessageReadStatusRepository.findByChatIdAndUserId(chat.getId(), user.getId());
	    			boolean readYn = readStatusOpt.map(ChatMessageReadStatus::getReadYn).orElse(false);
	    			ChatMessageResponseDTO dto = ChatMessageResponseDTO.fromEntity(chat, readYn);
	    			
	    			// ⭐ unreadCount를 실시간으로 계산하여 설정 (DB 저장값이 아닌 실제 읽지 않은 사람 수)
	    			int realUnreadCount = chatMessageReadStatusRepository.countUnreadByChatId(chat.getId());
	    			dto.setUnreadCount(realUnreadCount);
	    			
	    			// 프로필 이미지 URL 설정 (user_profile_image_key 사용)
	    			if (dto != null && chat.getSender() != null && chat.getSender().getId() != null) {
	    			    // ⭐ senderEmail 명시적으로 설정 (lazy loading 문제 해결)
	    			    // fromEntity에서 chat.getSender().getEmail()이 null일 수 있으므로 userRepository로 명시적으로 조회
	    			    // ⭐ LazyInitializationException 방지: Department를 함께 로드하는 메서드 사용
	    			    User senderUser = userRepository.findByIdWithDepartment(chat.getSender().getId()).orElse(null);
	    			    if (senderUser != null && senderUser.getEmail() != null) {
	    			        dto.setSenderEmail(senderUser.getEmail());
	    			        log.debug("[getMyChatMessages] senderEmail 설정 - userId: {}, email: {}", 
	    			                senderUser.getId(), senderUser.getEmail());
	    			    } else {
	    			        log.warn("[getMyChatMessages] senderEmail 설정 실패 - chat.getSender().getId(): {}, senderUser가 null이거나 email이 null", 
	    			                chat.getSender().getId());
	    			    }
	    			    
	    			    // ⭐ 프로필 이미지 URL 설정 (user_profile_image_key 사용)
	    			    // 프로필 이미지가 없어도 항상 senderProfileImageUrl 필드를 설정 (null이 아닌 빈 문자열 또는 URL)
	    			    String profileImageKey = senderUser.getProfileImageKey();
	    			    if (profileImageKey != null && !profileImageKey.isBlank()) {
	    			        // 프로필 이미지가 있으면 S3 URL 생성
	    			        String profileImageUrl = s3Service.getFileUrl(profileImageKey);
	    			        dto.setSenderProfileImageUrl(profileImageUrl);
	    			    } else {
	    			        // 프로필 이미지가 없으면 빈 문자열 설정 (프론트엔드에서 기본 이니셜 표시)
	    			        dto.setSenderProfileImageUrl("");
	    			    }
	    			    
	    			    // ⭐ 직급 설정
	    			    dto.setSenderJobGrade(senderUser.getJobGrade());
	    			    
	    			    // ⭐ 부서명 설정
	    			    if (senderUser.getDepartment() != null) {
	    			        dto.setSenderDeptName(senderUser.getDepartment().getDeptName());
	    			    } else {
	    			        dto.setSenderDeptName("");
	    			    }
	    			}
	    			
	    			return dto;
	    		})
	    		.collect(Collectors.toList());

	    // 5. 응답 반환
	    return ResponseEntity.ok(ResponseDTO.success(chatDtoList, "내 채팅방 메시지 조회 성공"));
	}
	
	
	/**
	 * 5. 내가 접속한 채팅방에 모든 메시지 날짜 오름차순 조회 (페이징 지원)
	 * 
	 * */
	@GetMapping("/{roomId}/messages")
	public ResponseEntity<ResponseDTO<org.springframework.data.domain.Page<ChatMessageResponseDTO>>> getChatRoomMessagesByChatRoomId(
	    @PathVariable("roomId") Integer roomId,
	    @RequestParam(value = "page", defaultValue = "0") int page,
	    @RequestParam(value = "size", defaultValue = "20") int size,
	    @AuthenticationPrincipal CustomUserDetails customUserDetails) {
	    log.debug("여기 들어옴=============================");
	    try {
	        String email = customUserDetails.getEmail();
	        User user = userRepository.findByEmail(email).orElseThrow();
	        Integer userId = user.getId();

	        // === 방 존재 체크 (없으면 Exception!)
	        boolean exists = chatRoomService.existsByRoomId(roomId);
	        if (!exists) {
	            throw new ChatNotFoundException("roomId: " + roomId + " 채팅방이 없습니다.");
	        }

	        // ⭐ updateUnreadCountForMessages 호출 제거
	        // 메시지 조회 시 접속 중인 사용자의 모든 메시지를 읽음 처리하면 안 됨
	        // unreadCount는 각 메시지별로 DB에서 직접 조회하여 사용

	        // 페이징 처리
	        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
	        org.springframework.data.domain.Page<Chat> chatPage = chatRoomService.getChatsWithFilesByRoomIdPaged(roomId, pageable);

	        // DTO 변환
	        org.springframework.data.domain.Page<ChatMessageResponseDTO> dtoPage = chatPage.map(chat -> {
	            Optional<ChatMessageReadStatus> readStatusOpt =
	                chatMessageReadStatusRepository.findByChatIdAndUserId(chat.getId(), userId);
	            boolean readYn = readStatusOpt.map(ChatMessageReadStatus::getReadYn).orElse(false);
	            ChatMessageResponseDTO dto = ChatMessageResponseDTO.fromEntity(chat, readYn, s3Service);
	            
	            // ⭐ unreadCount를 실시간으로 계산하여 설정 (DB 저장값이 아닌 실제 읽지 않은 사람 수)
	            int realUnreadCount = chatMessageReadStatusRepository.countUnreadByChatId(chat.getId());
	            dto.setUnreadCount(realUnreadCount);
	            
	            // 프로필 이미지 URL 설정 (user_profile_image_key 사용)
	            // sender를 명시적으로 조회하여 profileImageKey 가져오기
	            if (dto != null && chat.getSender() != null && chat.getSender().getId() != null) {
	                // ⭐ LazyInitializationException 방지: Department를 함께 로드하는 메서드 사용
	                User senderUser = userRepository.findByIdWithDepartment(chat.getSender().getId()).orElse(null);
	                if (senderUser != null) {
	                    // ⭐ senderEmail 명시적으로 설정 (lazy loading 문제 해결)
	                    // fromEntity에서 chat.getSender().getEmail()이 null일 수 있으므로 senderUser.getEmail() 직접 설정
	                    dto.setSenderEmail(senderUser.getEmail());
	                    
	                    // ⭐ 프로필 이미지 URL 설정 (user_profile_image_key 사용)
	                    // 프로필 이미지가 없어도 항상 senderProfileImageUrl 필드를 설정 (null이 아닌 빈 문자열 또는 URL)
	                    if (senderUser.getProfileImageKey() != null 
	                        && !senderUser.getProfileImageKey().isBlank()) {
	                        // 프로필 이미지가 있으면 S3 URL 생성
	                        String profileImageUrl = s3Service.getFileUrl(senderUser.getProfileImageKey());
	                        dto.setSenderProfileImageUrl(profileImageUrl);
	                    } else {
	                        // 프로필 이미지가 없으면 빈 문자열 설정 (프론트엔드에서 기본 이니셜 표시)
	                        dto.setSenderProfileImageUrl("");
	                    }
	                    
	                    // ⭐ 직급 설정
	                    dto.setSenderJobGrade(senderUser.getJobGrade());
	                    
	                    // ⭐ 부서명 설정
	                    if (senderUser.getDepartment() != null) {
	                        dto.setSenderDeptName(senderUser.getDepartment().getDeptName());
	                    } else {
	                        dto.setSenderDeptName("");
	                    }
	                }
	            }
	            
	            return dto;
	        });

	        log.debug("messages page: {}, total: {}", chatPage.getNumber(), chatPage.getTotalElements());

	        return ResponseEntity.ok(ResponseDTO.success(dtoPage, "채팅방 메시지 페이징 조회 성공"));
	    } catch (Exception e) {
	        e.printStackTrace();  // 실제 서버 콘솔에서 이 라인으로 에러 내용 확인
	        throw e; // 예외를 다시 던짐(원래 응답 흐름 보존)
	    }
	}
	
	/**
	 * 6. 채팅 메시지 정렬(내꺼/남의꺼)
	 * */
	@Operation(summary = "채팅 메시지 내/남 구분", description = "선택한 채팅방의 메시지를 내/다른 사람 메시지로 구분하여 조회합니다.")
    @GetMapping("/{roomId}/messages/sender")
    public ResponseEntity<ResponseDTO<List<ChatMessageSenderTypeResponseDTO>>> getChatRoomMessagesWithSenderType(
            @PathVariable("roomId") Integer roomId,
            @AuthenticationPrincipal CustomUserDetails customUserDetails
    ) {
	      String email = customUserDetails.getEmail();
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
	public ResponseEntity<ResponseDTO<ChatResponseDTO>> replyToMessage(@PathVariable("roomId") Integer roomId, @AuthenticationPrincipal CustomUserDetails user, @RequestBody ReplyMessageRequestDTO req) {
		String email = user.getEmail();
	  // ⭐ LazyInitializationException 방지: Department를 함께 로드하는 메서드 사용
	  User sender = userRepository.findByEmailWithDepartment(email).orElseThrow();
		Chat replyChat = chatRoomService.sendChatMessage(roomId, sender.getId(), req.getReplyContent());
		if (replyChat == null) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(ResponseDTO.error("답신 메시지 저장 실패"));
		}
		
		// ⭐ unreadCount는 sendChatMessage에서 실시간 접속자 수를 기반으로 계산되어 Chat 엔티티에 설정됨
		// 공식: unreadCount = (참여자 전체 - 발신자 - 접속중인 다른 사용자)
		ChatResponseDTO dto = ChatResponseDTO.fromEntity(replyChat);
		
		// ⭐ sendChatMessage에서 계산된 unreadCount 사용
		int realUnreadCount = replyChat.getUnreadCount() != null ? replyChat.getUnreadCount() : 0;
		dto.setUnreadCount(realUnreadCount);
		
		// ⭐ senderEmail 명시적으로 설정 (lazy loading 문제 해결)
		// fromEntity에서 chat.getSender().getEmail()이 null일 수 있으므로 sender.getEmail() 직접 설정
		dto.setSenderEmail(sender.getEmail());
		
		// ⭐ 프로필 이미지 URL 설정 (user_profile_image_key 사용)
		// 프로필 이미지가 없어도 항상 senderProfileImageUrl 필드를 설정 (null이 아닌 빈 문자열 또는 URL)
		if (sender != null) {
		    if (sender.getProfileImageKey() != null && !sender.getProfileImageKey().isBlank()) {
		        // 프로필 이미지가 있으면 S3 URL 생성
		        String profileImageUrl = s3Service.getFileUrl(sender.getProfileImageKey());
		        dto.setSenderProfileImageUrl(profileImageUrl);
		    } else {
		        // 프로필 이미지가 없으면 빈 문자열 설정 (프론트엔드에서 기본 이니셜 표시)
		        dto.setSenderProfileImageUrl("");
		    }
		    
		    // ⭐ 직급 설정
		    dto.setSenderJobGrade(sender.getJobGrade());
		    
		    // ⭐ 부서명 설정
		    if (sender.getDepartment() != null) {
		        dto.setSenderDeptName(sender.getDepartment().getDeptName());
		    } else {
		        dto.setSenderDeptName("");
		    }
		}
		return ResponseEntity.status(HttpStatus.CREATED).body(ResponseDTO.success(dto, "답신 메시지 저장 성공"));		
	}
	
	
	/**
	 * 8. 파일/이미지 업로드 및 미리보기
	 * @throws java.io.IOException 
	 * */
	@Operation(summary = "채팅방 파일/이미지 업로드", description = "채팅방에 파일/이미지를 업로드합니다")
	@PostMapping("/{roomId}/messages/file")
	public ResponseEntity<ResponseDTO<ChatResponseDTO>> uploadFileMessage(@PathVariable("roomId") Integer roomId, @AuthenticationPrincipal CustomUserDetails user, @RequestParam("file") MultipartFile uploadFile) throws java.io.IOException {
		String email = user.getEmail();
	  // ⭐ LazyInitializationException 방지: Department를 함께 로드하는 메서드 사용
	  User sender = userRepository.findByEmailWithDepartment(email).orElseThrow();
		String s3Key;
		String fileUrl;
		
		try {
			// s3에 업로드 (모든 파일 타입 허용)
			s3Key = s3Service.uploadChatFile(uploadFile, sender.getId());
			fileUrl = s3Service.getFileUrl(s3Key);
			
			log.info("[uploadFileMessage] 파일 업로드 성공 - fileName: {}, fileSize: {}, contentType: {}, s3Key: {}", 
			        uploadFile.getOriginalFilename(), uploadFile.getSize(), uploadFile.getContentType(), s3Key);
			
		} catch (IOException e) {
			log.error("[uploadFileMessage] 파일 s3 업로드 실패 - fileName: {}, error: {}", 
			        uploadFile.getOriginalFilename(), e.getMessage(), e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(ResponseDTO.internalError("파일 s3 업로드 실패: "+ e.getMessage()));
		} catch (IllegalArgumentException e) {
			log.error("[uploadFileMessage] 파일 업로드 검증 실패 - fileName: {}, error: {}", 
			        uploadFile.getOriginalFilename(), e.getMessage());
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body(ResponseDTO.error(400, "파일 업로드 검증 실패: " + e.getMessage()));
		}		
		
		// ⭐ MessageFile에는 S3 키를 저장 (URL이 아닌 키)
		MessageFile fileEntity = MessageFile.createMessageFile(
	                uploadFile.getOriginalFilename(),
	                (double) uploadFile.getSize(),
	                s3Key, // S3 키 저장 (URL이 아닌 키)
	                null // chat은 sendChatMessage에서 연결됨
	     );
		// fileUrl은 chat의 fileUrl 필드로도 저장해줄 수 있음
		Chat chat = chatRoomService.sendChatMessage(roomId, sender.getId(), fileEntity);
		if (chat == null) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(ResponseDTO.internalError("파일 메시지 저장 실패"));
		}
		
		// ⭐ unreadCount는 sendChatMessage에서 실시간 접속자 수를 기반으로 계산되어 Chat 엔티티에 설정됨
		// 공식: unreadCount = (참여자 전체 - 발신자 - 접속중인 다른 사용자)
		messageFileRepository.save(fileEntity);
		ChatResponseDTO dto = ChatResponseDTO.fromEntity(chat, s3Service);
		
		// ⭐ sendChatMessage에서 계산된 unreadCount 사용
		int realUnreadCount = chat.getUnreadCount() != null ? chat.getUnreadCount() : 0;
		dto.setUnreadCount(realUnreadCount);
		
		// ⭐ senderEmail 명시적으로 설정 (lazy loading 문제 해결)
		// fromEntity에서 chat.getSender().getEmail()이 null일 수 있으므로 sender.getEmail() 직접 설정
		dto.setSenderEmail(sender.getEmail());
		
		// fileUrl도 DTO에 포함 (S3 URL로 변환)
		dto.setFileUrl(fileUrl);
		
		// ⭐ 프로필 이미지 URL 설정 (user_profile_image_key 사용)
		// 프로필 이미지가 없어도 항상 senderProfileImageUrl 필드를 설정 (null이 아닌 빈 문자열 또는 URL)
		if (sender != null) {
		    if (sender.getProfileImageKey() != null && !sender.getProfileImageKey().isBlank()) {
		        // 프로필 이미지가 있으면 S3 URL 생성
		        String profileImageUrl = s3Service.getFileUrl(sender.getProfileImageKey());
		        dto.setSenderProfileImageUrl(profileImageUrl);
		    } else {
		        // 프로필 이미지가 없으면 빈 문자열 설정 (프론트엔드에서 기본 이니셜 표시)
		        dto.setSenderProfileImageUrl("");
		    }
		    
		    // ⭐ 직급 설정
		    dto.setSenderJobGrade(sender.getJobGrade());
		    
		    // ⭐ 부서명 설정
		    if (sender.getDepartment() != null) {
		        dto.setSenderDeptName(sender.getDepartment().getDeptName());
		    } else {
		        dto.setSenderDeptName("");
		    }
		}
		return ResponseEntity.status(HttpStatus.CREATED).body(ResponseDTO.success(dto, "파일/이미지 업로드 성공"));
	}
	
	/**
	 * 9. 다중 파일/이미지 업로드 (하나의 메시지로 묶기)
	 * @throws java.io.IOException 
	 * */
	@Operation(summary = "채팅방 다중 파일/이미지 업로드", description = "채팅방에 여러 파일/이미지를 하나의 메시지로 업로드합니다")
	@PostMapping("/{roomId}/messages/files")
	public ResponseEntity<ResponseDTO<ChatResponseDTO>> uploadMultipleFileMessage(
			@PathVariable("roomId") Integer roomId, 
			@AuthenticationPrincipal CustomUserDetails user, 
			@RequestParam("files") MultipartFile[] uploadFiles) throws java.io.IOException {
		String email = user.getEmail();
		// ⭐ LazyInitializationException 방지: Department를 함께 로드하는 메서드 사용
		User sender = userRepository.findByEmailWithDepartment(email).orElseThrow();
		
		if (uploadFiles == null || uploadFiles.length == 0) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body(ResponseDTO.error(400, "업로드할 파일이 없습니다."));
		}
		
		// ⚠️ 디버깅: 업로드된 파일 수 확인
		log.info("[uploadMultipleFileMessage] 업로드 요청 파일 수: {}", uploadFiles.length);
		
		// ⭐ 하나의 Chat 메시지 생성
		Chat chat = chatRoomService.sendChatMessage(roomId, sender.getId(), null);
		if (chat == null) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(ResponseDTO.error(500, "채팅 메시지 생성 실패"));
		}
		
		// ⭐ 각 파일을 S3에 업로드하고 MessageFile로 저장
		List<MessageFile> fileEntities = new ArrayList<>();
		int fileIndex = 0;
		for (MultipartFile uploadFile : uploadFiles) {
			fileIndex++;
			if (uploadFile.isEmpty()) {
				log.warn("[uploadMultipleFileMessage] 파일 {} 건너뜀 (빈 파일)", fileIndex);
				continue;
			}
			
			String s3Key;
			String fileUrl;
			try {
				// s3에 업로드 (모든 파일 타입 허용)
				s3Key = s3Service.uploadChatFile(uploadFile, sender.getId());
				fileUrl = s3Service.getFileUrl(s3Key);
				log.info("[uploadMultipleFileMessage] 파일 {} S3 업로드 성공: {} -> {}, contentType: {}, size: {} bytes", 
				        fileIndex, uploadFile.getOriginalFilename(), s3Key, uploadFile.getContentType(), uploadFile.getSize());
			} catch (IOException e) {
				log.error("[uploadMultipleFileMessage] 파일 {} S3 업로드 실패: {}", fileIndex, e.getMessage(), e);
				continue; // 개별 파일 업로드 실패 시 건너뛰기
			} catch (IllegalArgumentException e) {
				log.error("[uploadMultipleFileMessage] 파일 {} 업로드 검증 실패: {}", fileIndex, e.getMessage());
				continue; // 개별 파일 업로드 검증 실패 시 건너뛰기
			}
			
			// ⭐ MessageFile에는 S3 키를 저장 (URL이 아닌 키)
			MessageFile fileEntity = MessageFile.createMessageFile(
					uploadFile.getOriginalFilename(),
					(double) uploadFile.getSize(),
					s3Key, // S3 키 저장 (URL이 아닌 키)
					chat // 같은 chat에 연결
			);
			
			// chat의 파일리스트에 파일 추가 (양방향 매핑)
			chat.getMessageFiles().add(fileEntity);
			fileEntities.add(fileEntity);
			log.debug("[uploadMultipleFileMessage] 파일 {} MessageFile 생성 및 추가 완료. 현재 fileEntities.size(): {}", fileIndex, fileEntities.size());
		}
		
		log.info("[uploadMultipleFileMessage] 최종 fileEntities.size(): {}, chat.getMessageFiles().size(): {}", fileEntities.size(), chat.getMessageFiles().size());
		
		if (fileEntities.isEmpty()) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(ResponseDTO.error(500, "모든 파일 업로드 실패"));
		}
		
		// ⭐ Chat 저장 (fileYn = true로 설정) - 도메인 메서드 사용
		chat.updateFileYn(true);
		// ⭐ 첫 번째 파일의 S3 키를 chat의 fileUrl로 설정 (하위 호환성 - 나중에 URL로 변환됨)
		if (!fileEntities.isEmpty()) {
			chat.updateFileUrl(fileEntities.get(0).getS3ObjectKey());
		}
		
		// ⭐ Chat 저장 (cascade = CascadeType.ALL이므로 MessageFile도 함께 저장됨)
		// ⚠️ 중요: 
		// 1. messageFileRepository.save()를 개별적으로 호출하지 않음
		// 2. chat.getMessageFiles()에 이미 추가한 파일들이 cascade로 인해 자동 저장됨
		// 3. fileEntities 리스트를 사용하여 정확한 파일 목록을 DTO에 설정
		chat = chatRepository.save(chat);
		
		// ⭐ 저장 후 chat을 다시 조회하여 messageFiles를 명시적으로 로드
		// ⚠️ 중요: 저장 직후에는 lazy loading으로 인해 messageFiles가 제대로 로드되지 않을 수 있음
		// 따라서 저장 후 다시 조회하여 messageFiles를 명시적으로 로드
		Chat savedChat = chatRepository.findByIdWithMessageFiles(chat.getId());
		if (savedChat != null) {
			chat = savedChat;
			log.info("[uploadMultipleFileMessage] 저장 후 재조회 - chat.getMessageFiles().size(): {}", chat.getMessageFiles().size());
		} else {
			log.error("[uploadMultipleFileMessage] 저장 후 재조회 실패! chatId: {}", chat.getId());
		}
		
		// ⭐ 여러 파일 URL 목록 설정 (S3 키를 URL로 변환) - fileEntities를 직접 사용
		List<String> fileUrls = fileEntities.stream()
			.map(file -> {
				String s3Key = file.getS3ObjectKey();
				if (s3Key != null && !s3Key.isEmpty()) {
					return s3Service.getFileUrl(s3Key);
				}
				return null;
			})
			.filter(url -> url != null && !url.isEmpty())
			.collect(java.util.stream.Collectors.toList());
		
		log.info("[uploadMultipleFileMessage] 생성된 fileUrls.size(): {}", fileUrls.size());
		
		// ⭐ 첫 번째 파일의 URL (하위 호환성) - S3 URL로 변환
		String firstFileUrl = null;
		if (!fileEntities.isEmpty() && fileEntities.get(0).getS3ObjectKey() != null) {
			firstFileUrl = s3Service.getFileUrl(fileEntities.get(0).getS3ObjectKey());
		}
		
		// ⭐ DTO 생성 - fileUrls와 fileUrl을 직접 설정
		ChatResponseDTO dto = ChatResponseDTO.fromEntity(chat, s3Service);
		
		// ⭐ sendChatMessage에서 계산된 unreadCount 사용
		int realUnreadCount = chat.getUnreadCount() != null ? chat.getUnreadCount() : 0;
		dto.setUnreadCount(realUnreadCount);
		
		// ⭐ senderEmail 명시적으로 설정
		dto.setSenderEmail(sender.getEmail());
		
		// ⭐ 여러 파일 URL 목록 설정 (fileEntities를 직접 사용하여 정확한 파일 목록 반환)
		// ⚠️ 중요: fromEntity에서 설정한 fileUrls를 덮어씀 (chat.getMessageFiles()가 제대로 로드되지 않을 수 있음)
		dto.setFileUrls(fileUrls);
		
		// ⭐ 첫 번째 파일의 URL을 DTO에 설정 (하위 호환성)
		if (firstFileUrl != null) {
			dto.setFileUrl(firstFileUrl);
		}
		
		// ⭐ 프로필 이미지 URL 설정
		if (sender != null && sender.getProfileImageKey() != null && !sender.getProfileImageKey().isBlank()) {
			String profileImageUrl = s3Service.getFileUrl(sender.getProfileImageKey());
			dto.setSenderProfileImageUrl(profileImageUrl);
		}
		
		// ⚠️ 디버깅: 최종 DTO 확인
		log.debug("[uploadMultipleFileMessage] ⭐ 최종 DTO 확인:");
		log.debug("  - chatId: {}", dto.getId());
		log.debug("  - fileYn: {}", dto.getFileYn());
		log.debug("  - fileUrl: {}", dto.getFileUrl());
		log.debug("  - fileUrls.size(): {}", dto.getFileUrls() != null ? dto.getFileUrls().size() : 0);
		if (dto.getFileUrls() != null && !dto.getFileUrls().isEmpty()) {
			log.debug("  - fileUrls 내용:");
			for (int i = 0; i < dto.getFileUrls().size(); i++) {
				log.debug("    [{}] {}", i, dto.getFileUrls().get(i));
			}
		}
		
		// ⚠️ 디버깅: DB 저장 확인
		log.debug("[uploadMultipleFileMessage] ⭐ DB 저장 확인:");
		log.debug("  - chatId: {}", chat.getId());
		log.debug("  - chat.getMessageFiles().size(): {}", chat.getMessageFiles().size());
		if (!chat.getMessageFiles().isEmpty()) {
			log.debug("  - DB에 저장된 MessageFile 목록:");
			for (int i = 0; i < chat.getMessageFiles().size(); i++) {
				com.goodee.coreconnect.chat.entity.MessageFile mf = chat.getMessageFiles().get(i);
				log.debug("    [{}] id: {}, fileName: {}, s3Key: {}", i, mf.getId(), mf.getFileName(), mf.getS3ObjectKey());
			}
		}
		
		// ⭐ WebSocket으로 브로드캐스트
		String topic = "/topic/chat.room." + roomId;
		log.info("[uploadMultipleFileMessage] ⭐ WebSocket 브로드캐스트 시작 - topic: {}", topic);
		log.info("[uploadMultipleFileMessage] ⭐ 브로드캐스트할 DTO의 fileUrls: {}", dto.getFileUrls());
		log.info("[uploadMultipleFileMessage] ⭐ 브로드캐스트할 DTO의 fileUrls.size(): {}", dto.getFileUrls() != null ? dto.getFileUrls().size() : 0);
		messagingTemplate.convertAndSend(topic, dto);
		log.info("[uploadMultipleFileMessage] ⭐ WebSocket 브로드캐스트 완료");
		
		return ResponseEntity.ok(ResponseDTO.success(dto, "다중 파일 업로드 성공"));
	}
	
	  // 10. 채팅방 초대 가능한 사용자 목록 조회 (참여자 제외)
    @Operation(summary = "채팅방 초대 가능한 사용자 목록 조회", description = "특정 채팅방에 참여하지 않은 모든 사용자 목록을 조회합니다.")
    @GetMapping("/{roomId}/users/available")
    public ResponseEntity<ResponseDTO<List<ChatUserResponseDTO>>> getAvailableUsersForInvite(
            @PathVariable("roomId") Integer roomId
    ) {
        log.info("[getAvailableUsersForInvite] 요청 시작 - roomId: {}", roomId);
        try {
            // 채팅방 존재 확인
            log.info("[getAvailableUsersForInvite] 채팅방 조회 시작");
            ChatRoom chatRoom = chatRoomService.findById(roomId);
            if (chatRoom == null) {
                log.warn("[getAvailableUsersForInvite] 채팅방을 찾을 수 없음 - roomId: {}", roomId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error(404, "채팅방을 찾을 수 없습니다."));
            }
            log.info("[getAvailableUsersForInvite] 채팅방 조회 성공 - roomId: {}, roomName: {}", roomId, chatRoom.getRoomName());
            
            // 현재 채팅방 참여자 ID 목록 조회
            log.info("[getAvailableUsersForInvite] 참여자 목록 조회 시작");
            List<Integer> participantIds = chatRoomService.getParticipantIds(roomId);
            log.info("[getAvailableUsersForInvite] 채팅방 {} 참여자 수: {}", roomId, participantIds.size());
            log.info("[getAvailableUsersForInvite] 참여자 ID 목록: {}", participantIds);
            
            // 모든 사용자 조회 (Department와 함께 로드하여 Lazy Loading 방지)
            log.info("[getAvailableUsersForInvite] 전체 사용자 조회 시작");
            List<User> allUsers;
            try {
                allUsers = userRepository.findAllWithDepartment();
                log.info("[getAvailableUsersForInvite] 전체 사용자 수: {}", allUsers.size());
            } catch (Exception e) {
                log.error("[getAvailableUsersForInvite] 전체 사용자 조회 실패", e);
                // Fallback: 일반 findAll 사용
                log.info("[getAvailableUsersForInvite] Fallback: findAll() 사용");
                allUsers = userRepository.findAll();
                log.info("[getAvailableUsersForInvite] Fallback 전체 사용자 수: {}", allUsers.size());
            }
            
            // 참여자 제외한 사용자만 필터링
            log.info("[getAvailableUsersForInvite] 참여자 제외 필터링 시작");
            List<User> availableUsers = allUsers.stream()
                    .filter(user -> {
                        if (user == null || user.getId() == null) {
                            log.warn("[getAvailableUsersForInvite] null 사용자 발견");
                            return false;
                        }
                        return true;
                    })
                    .filter(user -> !participantIds.contains(user.getId()))
                    .collect(Collectors.toList());
            
            log.info("[getAvailableUsersForInvite] 참여자 제외 후 사용자 수: {}", availableUsers.size());
            
            // DTO 변환 (프로필 이미지 URL 포함)
            log.info("[getAvailableUsersForInvite] DTO 변환 시작");
            List<ChatUserResponseDTO> dtoList = new ArrayList<>();
            for (User user : availableUsers) {
                try {
                    ChatUserResponseDTO dto = ChatUserResponseDTO.fromEntity(user, s3Service);
                    if (dto != null) {
                        dtoList.add(dto);
                    }
                } catch (Exception e) {
                    log.error("[getAvailableUsersForInvite] 사용자 DTO 변환 실패 - userId: {}, error: {}", 
                            user.getId(), e.getMessage(), e);
                    // 개별 사용자 변환 실패해도 계속 진행
                }
            }
            
            log.info("[getAvailableUsersForInvite] 채팅방 {} 초대 가능한 사용자 수: {}", roomId, dtoList.size());
            if (dtoList.size() > 0) {
                log.info("[getAvailableUsersForInvite] 첫 번째 사용자: id={}, name={}, email={}", 
                        dtoList.get(0).getId(), dtoList.get(0).getName(), dtoList.get(0).getEmail());
            }
            
            log.info("[getAvailableUsersForInvite] 요청 성공 - roomId: {}, 사용자 수: {}", roomId, dtoList.size());
            return ResponseEntity.ok(ResponseDTO.success(dtoList, "초대 가능한 사용자 목록 조회 성공"));
        } catch (Exception e) {
            log.error("[getAvailableUsersForInvite] 초대 가능한 사용자 목록 조회 실패 - roomId: {}", roomId, e);
            log.error("[getAvailableUsersForInvite] 에러 타입: {}", e.getClass().getName());
            log.error("[getAvailableUsersForInvite] 에러 메시지: {}", e.getMessage());
            if (e.getCause() != null) {
                log.error("[getAvailableUsersForInvite] 원인: {}", e.getCause().getMessage());
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("초대 가능한 사용자 목록 조회에 실패했습니다: " + e.getMessage()));
        }
    }
    
	  // 10. 채팅방 초대/참여
    @Operation(summary = "채팅방에 사용자 초대", description = "채팅방에 사용자를 초대하고 참여 메시지를 전송합니다.")
    @PostMapping("/{roomId}/invite")
    @Transactional
    public ResponseEntity<ResponseDTO<List<ChatUserResponseDTO>>> inviteUsersToChatRoom(
            @PathVariable("roomId") Integer roomId,
            @RequestBody InviteUsersRequestDTO req,
            @AuthenticationPrincipal CustomUserDetails customUserDetails
    ) {
        try {
            log.info("[inviteUsersToChatRoom] 초대 요청 시작 - roomId: {}, userIds: {}", roomId, req.getUserIds());
            
            // 1. 요청 검증
            if (req == null || req.getUserIds() == null || req.getUserIds().isEmpty()) {
                log.warn("[inviteUsersToChatRoom] 잘못된 요청 - userIds가 null이거나 비어있음");
                return ResponseEntity.badRequest()
                        .body(ResponseDTO.error("초대할 사용자를 선택해주세요."));
            }
            
            String email = customUserDetails.getEmail();
            User inviter = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("초대자를 찾을 수 없습니다: " + email));
            
            // 2. 채팅방 존재 확인
            ChatRoom chatRoom = chatRoomService.findById(roomId);
            if (chatRoom == null) {
                log.warn("[inviteUsersToChatRoom] 채팅방을 찾을 수 없음 - roomId: {}", roomId);
                return ResponseEntity.badRequest()
                        .body(ResponseDTO.error("채팅방을 찾을 수 없습니다."));
            }
            
            // 3. 참여자 목록 조회
            List<Integer> participantIds = chatRoomService.getParticipantIds(roomId);
            log.info("[inviteUsersToChatRoom] 현재 참여자 수: {}, 참여자 IDs: {}", participantIds.size(), participantIds);
            
            // 4. 초대할 사용자 조회 및 중복 체크
            List<User> invitedUsers = new ArrayList<>();
            for (Integer userId : req.getUserIds()) {
                // 사용자 존재 확인
                User user = userRepository.findById(userId)
                        .orElse(null);
                
                if (user == null) {
                    log.warn("[inviteUsersToChatRoom] 사용자를 찾을 수 없음 - userId: {}", userId);
                    continue;
                }
                
                // 이미 참여 중인지 확인
                if (participantIds.contains(userId)) {
                    log.info("[inviteUsersToChatRoom] 이미 참여 중인 사용자 - userId: {}, userName: {}", userId, user.getName());
                    continue;
                }
                
                // DB에서도 중복 체크 (동시 요청 방지)
                Optional<ChatRoomUser> existing = chatRoomUserRepository.findByChatRoomIdAndUserId(roomId, userId);
                if (existing.isPresent()) {
                    log.info("[inviteUsersToChatRoom] 이미 참여 중인 사용자 (DB 확인) - userId: {}, userName: {}", userId, user.getName());
                    continue;
                }
                
                invitedUsers.add(user);
            }
            
            if (invitedUsers.isEmpty()) {
                log.warn("[inviteUsersToChatRoom] 초대할 사용자가 없음 - 요청된 userIds: {}", req.getUserIds());
                return ResponseEntity.badRequest()
                        .body(ResponseDTO.error("초대할 수 있는 사용자가 없습니다. 이미 참여 중이거나 존재하지 않는 사용자입니다."));
            }
            
            log.info("[inviteUsersToChatRoom] 초대할 사용자 수: {}", invitedUsers.size());
            
            // 5. 사용자 초대 처리
            List<ChatUserResponseDTO> dtoList = new ArrayList<>();
            for (User invited : invitedUsers) {
                try {
                    // ChatRoomUser 생성 및 저장
                    ChatRoomUser cru = ChatRoomUser.createChatRoomUser(invited, chatRoom);
                    chatRoomUserRepository.save(cru);
                    chatRoomUserRepository.flush(); // 즉시 DB 반영
                    
                    log.info("[inviteUsersToChatRoom] ChatRoomUser 저장 완료 - userId: {}, userName: {}", 
                            invited.getId(), invited.getName());
                    
                    // 초대 메시지 생성
                    String inviteMsg = invited.getName() + "님이 초대되었습니다";
                    Chat inviteChat = chatRoomService.sendChatMessage(roomId, inviter.getId(), inviteMsg);
                    
                    if (inviteChat == null) {
                        log.warn("[inviteUsersToChatRoom] 초대 메시지 생성 실패 - userId: {}", invited.getId());
                    }
                    
                    // 초대 알림 전송
                    String notificationMsg = chatRoom.getRoomName() + " 채팅방에 " + invited.getName() + "님이 초대되었습니다";
                    notificationService.sendNotification(
                        invited.getId(),
                        NotificationType.CHAT,
                        notificationMsg,
                        inviteChat != null ? inviteChat.getId() : null,
                        roomId,
                        inviter.getId(),
                        inviter.getName(),
                        null
                    );
                    
                    // DTO 생성
                    ChatUserResponseDTO dto = ChatUserResponseDTO.fromEntity(invited, s3Service);
                    if (dto != null) {
                        dtoList.add(dto);
                    }
                    
                    log.info("[inviteUsersToChatRoom] 초대 완료 - roomId: {}, invitedUserId: {}, invitedUserName: {}, inviterId: {}, inviterName: {}", 
                            roomId, invited.getId(), invited.getName(), inviter.getId(), inviter.getName());
                } catch (Exception e) {
                    log.error("[inviteUsersToChatRoom] 사용자 초대 중 오류 - userId: {}, userName: {}", 
                            invited.getId(), invited.getName(), e);
                    // 개별 사용자 초대 실패는 로그만 남기고 계속 진행
                }
            }
            
            if (dtoList.isEmpty()) {
                log.error("[inviteUsersToChatRoom] 모든 사용자 초대 실패");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(ResponseDTO.error("사용자 초대에 실패했습니다."));
            }
            
            log.info("[inviteUsersToChatRoom] 초대 성공 - roomId: {}, 초대된 사용자 수: {}", roomId, dtoList.size());
            return ResponseEntity.ok(ResponseDTO.success(dtoList, "초대 및 참여 메시지 저장 성공"));
        } catch (IllegalArgumentException e) {
            log.error("[inviteUsersToChatRoom] 잘못된 요청 - roomId: {}", roomId, e);
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error(e.getMessage()));
        } catch (Exception e) {
            log.error("[inviteUsersToChatRoom] 초대 처리 중 오류 - roomId: {}", roomId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("사용자 초대 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }
    
    // 11. 채팅방 나가기
    @Operation(summary = "채팅방 나가기", description = "채팅방에서 나가고 나가기 메시지를 전송합니다.")
    @org.springframework.web.bind.annotation.DeleteMapping("/{roomId}/leave")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ResponseDTO<String>> leaveChatRoom(
            @PathVariable("roomId") Integer roomId,
            Principal principal
    ) {
        try {
            String userEmail = principal.getName();
            log.info("[leaveChatRoom] 채팅방 나가기 요청 - roomId: {}, userEmail: {}", roomId, userEmail);
            
            chatRoomService.leaveChatRoom(roomId, userEmail);
            
            log.info("[leaveChatRoom] 채팅방 나가기 성공 - roomId: {}, userEmail: {}", roomId, userEmail);
            return ResponseEntity.ok(ResponseDTO.success("채팅방을 나갔습니다.", "채팅방 나가기 성공"));
        } catch (IllegalArgumentException e) {
            log.error("[leaveChatRoom] 채팅방 나가기 실패 - roomId: {}, error: {}", roomId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("채팅방 나가기 실패: " + e.getMessage()));
        } catch (Exception e) {
            log.error("[leaveChatRoom] 채팅방 나가기 중 예외 발생 - roomId: {}", roomId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("채팅방 나가기 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    // 10. 알림 읽음 처리 (채팅/업무)
    @Operation(summary = "알림 읽음 처리", description = "알림을 읽음 처리합니다.")
    @PutMapping("/notifications/{notificationId}/read")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ResponseDTO<NotificationReadResponseDTO>> markNotificationRead(
            @PathVariable("notificationId") Integer notificationId
    ) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("알림 없음: " + notificationId));
        
        // 이미 읽음 처리된 알림인지 확인
        if (Boolean.TRUE.equals(notification.getNotificationReadYn())) {
            log.info("[markNotificationRead] 알림이 이미 읽음 처리되어 있습니다. notificationId: {}", notificationId);
            NotificationReadResponseDTO dto = new NotificationReadResponseDTO(notification.getId(), notification.getNotificationReadYn());
            return ResponseEntity.ok(ResponseDTO.success(dto, "알림이 이미 읽음 처리되어 있습니다."));
        }
        
        // 알림 읽음 처리 (notification_read_yn = true, notification_read_at = 현재 시간)
        notification.markRead();
        notificationRepository.save(notification);
        
        // 즉시 DB에 반영되도록 flush
        notificationRepository.flush();
        
        log.info("[markNotificationRead] 알림 읽음 처리 완료 - notificationId: {}, notificationReadYn: {}, notificationReadAt: {}", 
                notification.getId(), notification.getNotificationReadYn(), notification.getNotificationReadAt());
        
        NotificationReadResponseDTO dto = new NotificationReadResponseDTO(notification.getId(), notification.getNotificationReadYn());
        return ResponseEntity.ok(ResponseDTO.success(dto, "알림 읽음 처리 성공"));
    }

    // 10-1. 모든 알림 읽음 처리
    @Operation(summary = "모든 알림 읽음 처리", description = "현재 사용자의 모든 안읽은 알림을 읽음 처리합니다.")
    @PutMapping("/notifications/read-all")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ResponseDTO<Integer>> markAllNotificationsAsRead(
            @AuthenticationPrincipal CustomUserDetails customUserDetails
    ) {
        String email = customUserDetails.getEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + email));
        
        // 현재 사용자의 모든 안읽은 알림 조회
        List<Notification> unreadNotifications = notificationRepository.findUnreadByUserId(user.getId());
        
        if (unreadNotifications.isEmpty()) {
            log.info("[markAllNotificationsAsRead] 읽지 않은 알림이 없습니다. userId: {}", user.getId());
            return ResponseEntity.ok(ResponseDTO.success(0, "읽지 않은 알림이 없습니다."));
        }
        
        // 모든 알림 읽음 처리
        int count = 0;
        LocalDateTime now = LocalDateTime.now();
        for (Notification notification : unreadNotifications) {
            // 이미 읽음 처리된 알림은 건너뛰기
            if (Boolean.TRUE.equals(notification.getNotificationReadYn())) {
                log.debug("[markAllNotificationsAsRead] 이미 읽음 처리된 알림 건너뛰기 - notificationId: {}", notification.getId());
                continue;
            }
            
            // 읽음 처리 전 상태 로그
            log.info("[markAllNotificationsAsRead] 읽음 처리 전 - notificationId: {}, readYn: {}, readAt: {}", 
                    notification.getId(), notification.getNotificationReadYn(), notification.getNotificationReadAt());
            
            // 읽음 처리
            notification.markRead();
            
            // 읽음 처리 후 상태 로그
            log.info("[markAllNotificationsAsRead] 읽음 처리 후 (엔티티 상태) - notificationId: {}, readYn: {}, readAt: {}", 
                    notification.getId(), notification.getNotificationReadYn(), notification.getNotificationReadAt());
            
            // saveAndFlush를 사용하여 즉시 DB에 반영
            Notification saved = notificationRepository.saveAndFlush(notification);
            
            // 저장 후 상태 확인
            log.info("[markAllNotificationsAsRead] 저장 후 (DB 상태) - notificationId: {}, readYn: {}, readAt: {}", 
                    saved.getId(), saved.getNotificationReadYn(), saved.getNotificationReadAt());
            
            // DB에서 다시 조회하여 확인
            notificationRepository.findById(notification.getId()).ifPresent(verified -> {
                log.info("[markAllNotificationsAsRead] DB 재조회 확인 - notificationId: {}, readYn: {}, readAt: {}", 
                        verified.getId(), verified.getNotificationReadYn(), verified.getNotificationReadAt());
                if (!Boolean.TRUE.equals(verified.getNotificationReadYn())) {
                    log.error("[markAllNotificationsAsRead] ⚠️ 경고 - DB에 읽음 처리가 반영되지 않았습니다! notificationId: {}", verified.getId());
                }
            });
            
            count++;
        }
        
        // 읽음 처리 후 확인 (디버깅용)
        List<Notification> verifyUnread = notificationRepository.findUnreadByUserId(user.getId());
        log.info("[markAllNotificationsAsRead] 모든 알림 읽음 처리 완료 - userId: {}, 처리된 알림 수: {}, 읽음 처리 후 남은 안읽은 알림 수: {}", 
                user.getId(), count, verifyUnread.size());
        
        if (verifyUnread.size() > 0) {
            log.warn("[markAllNotificationsAsRead] ⚠️ 읽음 처리 후에도 안읽은 알림이 남아있습니다. 남은 알림 ID: {}", 
                    verifyUnread.stream().map(Notification::getId).collect(java.util.stream.Collectors.toList()));
        }
        
        return ResponseEntity.ok(ResponseDTO.success(count, String.format("%d개의 알림을 읽음 처리했습니다.", count)));
    }

    // 11. 미읽은 알림/채팅 메시지 요약
    @Operation(summary = "미읽은 알림 요약", description = "가장 최근 알림만 띄우고 채팅 메시지 안읽은 개수만 표시")
    @GetMapping("/notifications/unread")
    public ResponseEntity<ResponseDTO<UnreadNotificationSummaryDTO>> getLatestUnreadNotificationSummary(
            @AuthenticationPrincipal CustomUserDetails customUserDetails
    ) {
        String email = customUserDetails.getEmail();
        User user = userRepository.findByEmail(email).orElseThrow();
        
        // ⭐ 채팅 메시지 안읽은 개수만 조회 (알림 개수는 제외)
        List<ChatMessageReadStatus> unreadChatMessages = chatMessageReadStatusRepository.findByUserIdAndReadYnFalse(user.getId());
        int chatUnreadCount = unreadChatMessages != null ? unreadChatMessages.size() : 0;
        
        log.info("[getLatestUnreadNotificationSummary] ⭐ 채팅 메시지 안읽은 개수만 반환: {}", chatUnreadCount);
        
        // 최신 알림 정보는 유지 (팝오버에서 사용할 수 있도록)
        List<NotificationType> allowedTypes = List.of(NotificationType.EMAIL, NotificationType.NOTICE, NotificationType.APPROVAL, NotificationType.SCHEDULE);
        List<Notification> unreadNotifications = notificationRepository.findUnreadByUserIdAndTypes(user.getId(), allowedTypes);
        List<Notification> filtered = unreadNotifications.stream()
                .filter(n -> allowedTypes.contains(n.getNotificationType()))
                .sorted(Comparator.comparing(Notification::getNotificationSentAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .toList();
        
        Notification latest = filtered.isEmpty() ? null : filtered.get(0);
        
        // ⭐ 중요: unreadCount에는 채팅 메시지 안읽은 개수만 설정
        UnreadNotificationSummaryDTO dto = UnreadNotificationSummaryDTO.from(latest, chatUnreadCount);
        return ResponseEntity.ok(ResponseDTO.success(dto, "미읽은 알림 요약 조회 성공"));
    }
    
    
    // 13. 실시간 알림 WebSocket 푸시 테스트
    @Operation(summary = "실시간 알림 WebSocket 푸시 테스트", description = "WebSocket을 통해 실시간 알림을 테스트합니다.")
    @PostMapping("/notifications/push-test")
    public ResponseEntity<ResponseDTO<String>> pushNotificationTest(
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestBody PushNotificationTestRequestDTO req
    ) {
        String email = customUserDetails.getEmail();
        User user = userRepository.findByEmail(email).orElseThrow();
        notificationService.sendNotification(
                user.getId(),
                NotificationType.EMAIL,
                req.getMessage(),
                null, null,
                user.getId(),
                user.getName(),
                null
        );
        return ResponseEntity.ok(ResponseDTO.success("푸시 테스트 성공", "알림 푸시 테스트 완료"));
    }
    
    // 14. 내가 참여중인 채팅방들의 마지막 메시지만 조회
    @Operation(summary = "내가 참여중인 채팅방들의 목록/마지막 메시지/안읽은 메시지수 조회", description = "내가 참여중인 채팅방들의 목록과 마지막 메시지, 안읽은 메시지수를 함께 반환")
    @GetMapping("/rooms/messages/latest")
    public ResponseEntity<ResponseDTO<List<ChatRoomListDTO>>> getLatestMessages(@AuthenticationPrincipal CustomUserDetails customUserDetails) {
       String email = customUserDetails.getEmail();
    	 User user = userRepository.findByEmail(email).orElseThrow();
    	 
    	 // 서비스에서 한번에 방 목록/마지막 메시지/안읽은 메시지 수 채워서 반환
    	 List<ChatRoomListDTO> dtoList = chatRoomService.getChatRoomListWithUnreadCount(user.getId());
    	 log.info("dtoList: {}", dtoList);
        
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
            @PathVariable("roomId") Integer roomId,
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody SendMessageRequestDTO req
    ) {
        String email = user.getEmail();
        // ⭐ LazyInitializationException 방지: Department를 함께 로드하는 메서드 사용
        User sender = userRepository.findByEmailWithDepartment(email).orElseThrow();
        Chat chat = chatRoomService.sendChatMessage(roomId, sender.getId(), req.getContent());
        // 서비스 내에서 알림 발송도 처리
        ChatResponseDTO dto = ChatResponseDTO.fromEntity(chat);
        
        // ⭐ unreadCount는 sendChatMessage에서 실시간 접속자 수를 기반으로 계산되어 Chat 엔티티에 설정됨
        // 공식: unreadCount = (참여자 전체 - 발신자 - 접속중인 다른 사용자)
        int realUnreadCount = chat.getUnreadCount() != null ? chat.getUnreadCount() : 0;
        dto.setUnreadCount(realUnreadCount);
        
        // ⭐ senderEmail 명시적으로 설정 (lazy loading 문제 해결)
        // fromEntity에서 chat.getSender().getEmail()이 null일 수 있으므로 sender.getEmail() 직접 설정
        dto.setSenderEmail(sender.getEmail());
        
        // ⭐ 프로필 이미지 URL 설정 (user_profile_image_key 사용)
        // 프로필 이미지가 없어도 항상 senderProfileImageUrl 필드를 설정 (null이 아닌 빈 문자열 또는 URL)
        if (sender != null) {
            String profileImageKey = sender.getProfileImageKey();
            if (profileImageKey != null && !profileImageKey.isBlank()) {
                // 프로필 이미지가 있으면 S3 URL 생성
                String profileImageUrl = s3Service.getFileUrl(profileImageKey);
                log.info("[sendChatMessageAndNotify] 프로필 이미지 URL 생성 성공 - userId: {}, key: {}, url: {}", 
                        sender.getId(), profileImageKey, profileImageUrl);
                dto.setSenderProfileImageUrl(profileImageUrl);
            } else {
                // 프로필 이미지가 없으면 빈 문자열 설정 (프론트엔드에서 기본 이니셜 표시)
                log.warn("[sendChatMessageAndNotify] 프로필 이미지 없음 - userId: {}, email: {}, profileImageKey가 null 또는 빈 문자열", 
                        sender.getId(), sender.getEmail());
                dto.setSenderProfileImageUrl("");
            }
            
            // ⭐ 직급 설정
            dto.setSenderJobGrade(sender.getJobGrade());
            
            // ⭐ 부서명 설정
            if (sender.getDepartment() != null) {
                dto.setSenderDeptName(sender.getDepartment().getDeptName());
            } else {
                dto.setSenderDeptName("");
            }
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseDTO.success(dto, "메시지 전송 및 알림 발송 성공"));
    }

    // 17. 나에게 온 알림만 조회
    @Operation(summary = " 나에게 온 알림만 조회", description = " 나에게 온 알림만 조회")
    @GetMapping("/notifications")
    public ResponseEntity<ResponseDTO<List<NotificationDTO>>> getMyNotifications(@AuthenticationPrincipal CustomUserDetails customUserDetails) {
      String email = customUserDetails.getEmail();
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
    
    // 18. 내가 참여중인 채팅방의 안읽은 메시지 개수/목록 조회
    @Operation(summary = "내가 참여중인 채팅방의 안읽은 메시지 개수/목록 조회", description = "내가 참여중인 채팅방의 안읽은 메시지 개수/목록 조회")
    @GetMapping("/messages/unread")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> getUnreadMessages(@AuthenticationPrincipal CustomUserDetails customUserDetails) {
        
        String email = customUserDetails.getEmail();
        
        // 1. 응답용 Map 생성
        Map<String, Object> responseMap = new HashMap<>();

        // 2. 사용자 찾기 (로그인여부 검사)
        User user = userRepository.findByEmail(email).orElseThrow();

        // 3. 내가 참여중인 채팅방 목록 조회
        List<ChatRoomLatestMessageResponseDTO> chatRooms = chatRoomService.getChatRoomIdsByUserId(user.getId());

        // 4. 채팅방별 안읽은 메시지 개수, 마지막 메시지 정보 포함해서 응답용 리스트 생성
        List<Map<String, Object>> roomsWithUnread = new ArrayList<>();
        
        for (ChatRoomLatestMessageResponseDTO room : chatRooms) {
            // (1) 안읽은 메시지 개수
            Integer unreadCount = chatMessageReadStatusRepository.countByUserIdAndChatRoomIdAndReadYnFalse(user.getId(), room.getRoomId());

            // (2) 마지막 미읽음 메시지 정보 불러오기
            ChatMessageReadStatus lastUnreadStatus = chatMessageReadStatusRepository.findLastUnreadStatusInRoomForUser(user.getId(), room.getRoomId());

            // ***이 부분에 추가!***
            Integer lastUnreadMessageId = lastUnreadStatus != null ? lastUnreadStatus.getChat().getId() : null;
            String lastUnreadMessageContent = lastUnreadStatus != null ? lastUnreadStatus.getChat().getMessageContent() : null;
            String lastUnreadSenderName = lastUnreadStatus != null && lastUnreadStatus.getChat().getSender() != null
                ? lastUnreadStatus.getChat().getSender().getName() : null;
            LocalDateTime lastUnreadMessageTime = lastUnreadStatus != null ? lastUnreadStatus.getChat().getSendAt() : null;

            // 응답 map에 id도 추가
            Map<String, Object> roomMap = new HashMap<>();
            roomMap.put("roomId", room.getRoomId());
            roomMap.put("roomName", room.getRoomName());
            roomMap.put("unreadCount", unreadCount);
            roomMap.put("lastUnreadMessageId", lastUnreadMessageId); // ← 추가!
            roomMap.put("lastUnreadMessageContent", lastUnreadMessageContent);
            roomMap.put("lastUnreadMessageSenderName", lastUnreadSenderName);
            roomMap.put("lastUnreadMessageTime", lastUnreadMessageTime);

            log.info(
              "======== lastUnreadMessageId: {}, roomId: {}, unreadCount: {}, lastMessage: {}",
              lastUnreadMessageId,
              room.getRoomId(),
              unreadCount,
              lastUnreadMessageContent
            );

            roomsWithUnread.add(roomMap);
        }

        // 나머지 참고용 목록 및 데이터
        List<Integer> roomIds = chatRooms.stream()
            .map(ChatRoomLatestMessageResponseDTO::getRoomId)
            .collect(Collectors.toList());

        List<ChatMessageReadStatus> unreadStatuses = chatMessageReadStatusRepository.findByUserIdAndReadYnFalse(user.getId());

        Map<Integer, String> roomIdToName = chatRooms.stream()
            .collect(Collectors.toMap(ChatRoomLatestMessageResponseDTO::getRoomId, ChatRoomLatestMessageResponseDTO::getRoomName));

        List<ChatMessageResponseDTO> unreadMessages = unreadStatuses.stream()
        		// 각 ChatMessageReadStatus에 대해 메시지 객체와 내 읽음 여부 getReadYn()를 함께 전달
        		.map(status -> {
        		    ChatMessageResponseDTO dto = ChatMessageResponseDTO.fromEntity(status.getChat(), status.getReadYn(), s3Service);
        		    
        		    // ⭐ senderEmail 명시적으로 설정 (lazy loading 문제 해결)
        		    if (dto != null && status.getChat() != null && status.getChat().getSender() != null 
        		        && status.getChat().getSender().getId() != null) {
        		        // ⭐ LazyInitializationException 방지: Department를 함께 로드하는 메서드 사용
        		        User senderUser = userRepository.findByIdWithDepartment(status.getChat().getSender().getId()).orElse(null);
        		        if (senderUser != null && senderUser.getEmail() != null) {
        		            dto.setSenderEmail(senderUser.getEmail());
        		            log.debug("[getUnreadChatMessages] senderEmail 설정 - userId: {}, email: {}", 
        		                    senderUser.getId(), senderUser.getEmail());
        		        }
        		        
        		        // ⭐ 프로필 이미지 URL 설정
        		        String profileImageKey = senderUser.getProfileImageKey();
        		        if (profileImageKey != null && !profileImageKey.isBlank()) {
        		            String profileImageUrl = s3Service.getFileUrl(profileImageKey);
        		            dto.setSenderProfileImageUrl(profileImageUrl);
        		        } else {
        		            dto.setSenderProfileImageUrl("");
        		        }
        		    }
        		    
        		    return dto;
        		})
        		.collect(Collectors.toList());

        // 최종 응답 구성 (프론트에 roomsWithUnread를 활용)
        responseMap.put("chatRooms", chatRooms);
        responseMap.put("roomNames", roomIdToName);
        responseMap.put("messages", unreadMessages);
        responseMap.put("roomsWithUnread", roomsWithUnread);

        return ResponseEntity.ok(ResponseDTO.success(responseMap, "내 미읽은 채팅 메시지 + 방 이름 목록 조회 성공"));
    }
    
    // 19. 나에게 온 안읽은 알림 개수 클릭 시, 가장 최근에 온 알림을 제외한 나머지 안읽은 알림 리스트를 반환
    @Operation(summary = "나에게 온 안읽은 알림 개수 클릭 시, 가장 최근에 온 알림을 제외한 나머지 안읽은 알림 리스트를 반환", description = "나에게 온 안읽은 알림 개수 클릭 시, 가장 최근에 온 알림을 제외한 나머지 안읽은 알림 리스트를 반환")
    @GetMapping("/unread/list")
    public ResponseEntity<List<UnreadNotificationListDTO>> getUnreadNotificationsExceptLatest(
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestParam(name = "unreadCount", required = false) Integer unreadCountParam
    ) {
        String email = customUserDetails.getEmail();
        User user = userRepository.findByEmail(email).orElseThrow();
        List<NotificationType> allowedTypes = List.of(NotificationType.EMAIL, NotificationType.NOTICE, NotificationType.APPROVAL, NotificationType.SCHEDULE);

        List<UnreadNotificationListDTO> unreadDtos = chatRoomService.getUnreadNotificationsExceptLatest(user.getId(), allowedTypes);
        return ResponseEntity.ok(unreadDtos);
    }
    
    // 21. 모든 안읽은 알림 목록 조회
    @Operation(summary = "모든 안읽은 알림 목록 조회", description = "사용자의 모든 안읽은 알림을 최신순으로 조회")
    @GetMapping("/notifications/unread/all")
    public ResponseEntity<ResponseDTO<List<UnreadNotificationListDTO>>> getAllUnreadNotifications(
            @AuthenticationPrincipal CustomUserDetails customUserDetails
    ) {
        try {
            String email = customUserDetails.getEmail();
            User user = userRepository.findByEmail(email).orElseThrow();
            log.info("🔔 [getAllUnreadNotifications] 요청 사용자: email={}, userId={}, name={}", email, user.getId(), user.getName());
            
            List<NotificationType> allowedTypes = List.of(NotificationType.EMAIL, NotificationType.NOTICE, NotificationType.APPROVAL, NotificationType.SCHEDULE, NotificationType.CHAT);
            
            // DB에서 직접 조회하여 확인
            List<Notification> allUserNotifications = notificationRepository.findByUserIdOrderBySentAtDesc(user.getId());
            log.info("🔔 [getAllUnreadNotifications] DB 직접 조회 - 전체 알림 개수: {}", allUserNotifications.size());
            if (!allUserNotifications.isEmpty()) {
                log.info("🔔 [getAllUnreadNotifications] 전체 알림 상세:");
                allUserNotifications.forEach(n -> log.info("  - 알림 ID: {}, 타입: {}, 읽음여부: {}, 삭제여부: {}, user_id: {}", 
                        n.getId(), n.getNotificationType(), n.getNotificationReadYn(), n.getNotificationDeletedYn(), n.getUser().getId()));
            }
            
            List<Notification> unreadList = notificationRepository.findUnreadByUserIdAndTypesOrderBySentAtDesc(user.getId(), allowedTypes);
            
            log.info("🔔 [getAllUnreadNotifications] 사용자 ID: {}, 안읽은 알림 개수: {}, allowedTypes: {}", 
                    user.getId(), unreadList.size(), allowedTypes);
            
            // 안읽은 알림 상세 로그
            if (!unreadList.isEmpty()) {
                log.info("🔔 [getAllUnreadNotifications] 안읽은 알림 상세:");
                unreadList.forEach(n -> log.info("  - 알림 ID: {}, 타입: {}, 읽음여부: {}, 삭제여부: {}, user_id: {}, board_id: {}", 
                        n.getId(), n.getNotificationType(), n.getNotificationReadYn(), n.getNotificationDeletedYn(), 
                        n.getUser().getId(), n.getBoard() != null ? n.getBoard().getId() : null));
            } else {
                log.warn("🔔 [getAllUnreadNotifications] ⚠️ 안읽은 알림이 없습니다! 사용자 ID: {}", user.getId());
            }
            
            // 디버깅: NOTICE 타입 알림이 있는지 확인
            long noticeCount = unreadList.stream()
                    .filter(n -> n.getNotificationType() == NotificationType.NOTICE)
                    .count();
            log.info("🔔 [getAllUnreadNotifications] NOTICE 타입 알림 개수: {}", noticeCount);
            
            // 전체 알림 조회 (필터 없이) - 디버깅용
            List<Notification> allNotifications = notificationRepository.findByUserIdOrderBySentAtDesc(user.getId());
            long totalNoticeCount = allNotifications.stream()
                    .filter(n -> n.getNotificationType() == NotificationType.NOTICE)
                    .count();
            log.info("🔔 [getAllUnreadNotifications] 전체 알림 개수: {}, NOTICE 타입: {}", 
                    allNotifications.size(), totalNoticeCount);
            
            // NOTICE 타입 알림 상세 로그
            if (totalNoticeCount > 0) {
                log.info("🔔 [getAllUnreadNotifications] NOTICE 타입 알림 상세:");
                allNotifications.stream()
                        .filter(n -> n.getNotificationType() == NotificationType.NOTICE)
                        .forEach(n -> log.info("  - 알림 ID: {}, 읽음여부: {}, 삭제여부: {}, user_id: {}, board_id: {}", 
                                n.getId(), n.getNotificationReadYn(), n.getNotificationDeletedYn(), 
                                n.getUser().getId(), n.getBoard() != null ? n.getBoard().getId() : null));
            }
            
            // 쿼리 조건 확인을 위한 로그
            log.info("🔔 [getAllUnreadNotifications] 쿼리 조건: userId={}, notificationReadYn=false or null, notificationDeletedYn=false or null, types={}", 
                    user.getId(), allowedTypes);
            
            List<UnreadNotificationListDTO> unreadDtos = new ArrayList<>();
            for (Notification n : unreadList) {
                try {
                    log.info("🔔 [getAllUnreadNotifications] 알림 ID: {}, 타입: {}, 메시지: {}, 읽음여부: {}, 삭제여부: {}", 
                            n.getId(), n.getNotificationType(), n.getNotificationMessage(), n.getNotificationReadYn(), n.getNotificationDeletedYn());
                    
                    // DTO 변환 시 LazyInitializationException 방지를 위해 명시적으로 접근
                    Integer scheduleIdValue = null;
                    try {
                        if (n.getSchedule() != null) {
                            scheduleIdValue = n.getSchedule().getId();
                            log.info("🔔 [getAllUnreadNotifications] 알림 ID: {}, Schedule ID: {}", n.getId(), scheduleIdValue);
                        } else {
                            log.warn("🔔 [getAllUnreadNotifications] 알림 ID: {}, Schedule이 null입니다.", n.getId());
                        }
                    } catch (Exception e) {
                        log.error("🔔 [getAllUnreadNotifications] Schedule 조회 실패 - 알림 ID: {}", n.getId(), e);
                    }
                    
                    // CHAT 타입 알림의 경우 roomId 추출
                    Integer roomIdValue = null;
                    try {
                        if (n.getChat() != null && n.getChat().getChatRoom() != null) {
                            roomIdValue = n.getChat().getChatRoom().getId();
                            log.info("🔔 [getAllUnreadNotifications] 알림 ID: {}, Chat Room ID: {}", n.getId(), roomIdValue);
                        }
                    } catch (Exception e) {
                        log.error("🔔 [getAllUnreadNotifications] Chat Room 조회 실패 - 알림 ID: {}", n.getId(), e);
                    }
                    
                    UnreadNotificationListDTO dto = UnreadNotificationListDTO.builder()
                            .notificationId(n.getId())
                            .message(n.getNotificationMessage())
                            .senderName(n.getSender() != null ? n.getSender().getName() : null)
                            .receiverName(n.getUser() != null ? n.getUser().getName() : null)
                            .sentAt(n.getNotificationSentAt())
                            .notificationType(n.getNotificationType() != null ? n.getNotificationType().name() : null)
                            .documentId(n.getDocument() != null ? n.getDocument().getId() : null)
                            .boardId(n.getBoard() != null ? n.getBoard().getId() : null)
                            .scheduleId(scheduleIdValue)
                            .build();
                    // roomId는 setter로 설정 (Lombok 빌더 이슈 방지)
                    dto.setRoomId(roomIdValue);
                    
                    unreadDtos.add(dto);
                } catch (Exception e) {
                    log.error("🔔 [getAllUnreadNotifications] 알림 DTO 변환 실패 - 알림 ID: {}", n.getId(), e);
                    // 개별 알림 변환 실패 시에도 계속 진행
                }
            }
            
            log.info("🔔 [getAllUnreadNotifications] DTO 변환 완료, DTO 개수: {}", unreadDtos.size());
            if (!unreadDtos.isEmpty()) {
                log.info("🔔 [getAllUnreadNotifications] 첫 번째 DTO 샘플: {}", unreadDtos.get(0));
            }
            
            return ResponseEntity.ok(ResponseDTO.success(unreadDtos, "모든 안읽은 알림 조회 성공"));
        } catch (Exception e) {
            log.error("🔔 [getAllUnreadNotifications] 알림 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("알림 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    // 20. 나에게 온 안읽은 메시지를 채팅방을 접속해서 다 읽으면 채팅방목록에서 안읽은 메시지 개수가 없어지게 만들기
    // ⭐ 각 메시지의 unreadCount를 -1 감소시키고 WebSocket으로 실시간 업데이트 알림
    @Operation(summary = "나에게 온 안읽은 메시지를 채팅방을 접속해서 다 읽으면 채팅방목록에서 안읽은 메시지 개수가 없어지게 만들기", description = "나에게 온 안읽은 메시지를 채팅방을 접속해서 다 읽으면 채팅방목록에서 안읽은 메시지 개수가 없어지게 만들기")
    @PatchMapping("/rooms/{roomId}/messages/read")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> markRoomMessagesAsRead(@PathVariable Integer roomId, @AuthenticationPrincipal CustomUserDetails customUserDetails) {
      String email = customUserDetails.getEmail();
    	User user = userRepository.findByEmail(email).orElseThrow();
    	
    	log.info("[markRoomMessagesAsRead] 읽음 처리 요청 - roomId: {}, userId: {}, email: {}", roomId, user.getId(), email);
    	
    	// ⭐ 메시지 읽음 처리 및 읽음 처리된 메시지 ID 리스트 반환
    	List<Integer> readChatIds = chatRoomService.markMessagesAsRead(roomId, user.getId());
    	
    	log.info("[markRoomMessagesAsRead] 읽음 처리 완료 - roomId: {}, userId: {}, 처리된 메시지 수: {}", roomId, user.getId(), readChatIds.size());
    	
    	// ⭐ WebSocket을 통해 실시간으로 unreadCount 업데이트 알림
    	// 각 메시지의 업데이트된 unreadCount를 전송 (발신자에게만 알림)
    	for (Integer chatId : readChatIds) {
    	    Optional<Chat> chatOpt = chatRepository.findById(chatId);
    	    if (chatOpt.isPresent()) {
    	        Chat chat = chatOpt.get();
    	        // ⭐ 메시지 발신자 정보 확인
    	        Integer senderId = chat.getSender() != null ? chat.getSender().getId() : null;
    	        String senderEmail = chat.getSender() != null ? chat.getSender().getEmail() : null;
    	        
    	        // ⭐ unreadCount를 실시간으로 계산 (DB 저장값이 아닌 실제 읽지 않은 사람 수)
    	        int realUnreadCount = chatMessageReadStatusRepository.countUnreadByChatId(chatId);
    	        
    	        // ⭐ unreadCount 업데이트 메시지 전송 (발신자 정보 및 읽은 사람 정보 포함)
    	        Map<String, Object> updateMessage = new HashMap<>();
    	        updateMessage.put("type", "UNREAD_COUNT_UPDATE");
    	        updateMessage.put("chatId", chatId);
    	        updateMessage.put("unreadCount", realUnreadCount); // ⭐ 실시간 계산된 값 사용
    	        updateMessage.put("roomId", roomId);
    	        updateMessage.put("senderId", senderId); // ⭐ 발신자 ID 추가
    	        updateMessage.put("senderEmail", senderEmail); // ⭐ 발신자 이메일 추가
    	        updateMessage.put("viewerId", user.getId()); // ⭐ 읽은 사람 ID 추가 (디버깅용)
    	        updateMessage.put("viewerEmail", email); // ⭐ 읽은 사람 이메일 추가 (디버깅용)
    	        
    	        // ⭐ 모든 참여자에게 전송 (모든 참여자가 실시간으로 unreadCount 업데이트)
    	        messagingTemplate.convertAndSend("/topic/chat.room." + roomId, updateMessage);
    	        log.info("[markRoomMessagesAsRead] unreadCount 업데이트 알림 전송 - chatId: {}, unreadCount: {} (실시간 계산), senderId: {}, senderEmail: {}", 
    	                chatId, realUnreadCount, senderId, senderEmail);
    	    }
    	}
    	
    	return ResponseEntity.ok().build();    	
    }
    
    
    
}