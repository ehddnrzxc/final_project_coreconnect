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

import io.jsonwebtoken.io.IOException;
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
	        saved.setUnreadCount(realUnreadCount);
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
	    System.out.println("여기 들어옴=============================");
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
	            ChatMessageResponseDTO dto = ChatMessageResponseDTO.fromEntity(chat, readYn);
	            
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

	        System.out.println("messages page: " + chatPage.getNumber() + ", total: " + chatPage.getTotalElements());

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
			ChatResponseDTO.fromEntity(replyChat);
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
		
		// ⭐ unreadCount는 sendChatMessage에서 실시간 접속자 수를 기반으로 계산되어 Chat 엔티티에 설정됨
		// 공식: unreadCount = (참여자 전체 - 발신자 - 접속중인 다른 사용자)
		messageFileRepository.save(fileEntity);
		ChatResponseDTO dto = ChatResponseDTO.fromEntity(chat);
		
		// ⭐ sendChatMessage에서 계산된 unreadCount 사용
		int realUnreadCount = chat.getUnreadCount() != null ? chat.getUnreadCount() : 0;
		dto.setUnreadCount(realUnreadCount);
		
		// ⭐ senderEmail 명시적으로 설정 (lazy loading 문제 해결)
		// fromEntity에서 chat.getSender().getEmail()이 null일 수 있으므로 sender.getEmail() 직접 설정
		dto.setSenderEmail(sender.getEmail());
		
		// fileUrl도 DTO에 포함
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
            @PathVariable("notificationId") Integer notificationId
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
            @AuthenticationPrincipal CustomUserDetails customUserDetails
    ) {
        String email = customUserDetails.getEmail();
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
                user.getName()
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
        		    ChatMessageResponseDTO dto = ChatMessageResponseDTO.fromEntity(status.getChat(), status.getReadYn());
        		    
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

    // 20. 나에게 온 안읽은 메시지를 채팅방을 접속해서 다 읽으면 채팅방목록에서 안읽은 메시지 개수가 없어지게 만들기
    // ⭐ 각 메시지의 unreadCount를 -1 감소시키고 WebSocket으로 실시간 업데이트 알림
    @Operation(summary = "나에게 온 안읽은 메시지를 채팅방을 접속해서 다 읽으면 채팅방목록에서 안읽은 메시지 개수가 없어지게 만들기", description = "나에게 온 안읽은 메시지를 채팅방을 접속해서 다 읽으면 채팅방목록에서 안읽은 메시지 개수가 없어지게 만들기")
    @PatchMapping("/rooms/{roomId}/messages/read")
    public ResponseEntity<?> markRoomMessagesAsRead(@PathVariable Integer roomId, @AuthenticationPrincipal CustomUserDetails customUserDetails) {
      String email = customUserDetails.getEmail();
    	User user = userRepository.findByEmail(email).orElseThrow();
    	
    	// ⭐ 메시지 읽음 처리 및 읽음 처리된 메시지 ID 리스트 반환
    	List<Integer> readChatIds = chatRoomService.markMessagesAsRead(roomId, user.getId());
    	
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