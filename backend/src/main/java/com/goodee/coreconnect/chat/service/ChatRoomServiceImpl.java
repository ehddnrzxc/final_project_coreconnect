package com.goodee.coreconnect.chat.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.socket.WebSocketSession;

import com.goodee.coreconnect.chat.event.NotificationCreatedEvent;
import com.goodee.coreconnect.common.dto.request.NotificationRequestDTO;
import com.goodee.coreconnect.common.entity.Notification;
import com.goodee.coreconnect.common.notification.dto.NotificationPayload; // DTO import 추가
import com.goodee.coreconnect.common.notification.enums.NotificationType;
import com.goodee.coreconnect.account.repository.AccountLogRepository;
import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.approval.repository.DocumentRepository;
import com.goodee.coreconnect.chat.dto.response.ChatResponseDTO;
import com.goodee.coreconnect.chat.dto.response.ChatRoomLatestMessageResponseDTO;
import com.goodee.coreconnect.chat.dto.response.ChatRoomListDTO;
import com.goodee.coreconnect.chat.dto.response.ChatRoomSummaryResponseDTO;
import com.goodee.coreconnect.chat.dto.response.UnreadNotificationListDTO;
import com.goodee.coreconnect.chat.entity.Chat;
import com.goodee.coreconnect.chat.entity.ChatMessageReadStatus;
import com.goodee.coreconnect.chat.entity.ChatRoom;
import com.goodee.coreconnect.chat.entity.ChatRoomUser;
import com.goodee.coreconnect.chat.entity.MessageFile;
import com.goodee.coreconnect.chat.repository.NotificationRepository;
import com.goodee.coreconnect.chat.repository.ChatMessageReadStatusRepository;
import com.goodee.coreconnect.chat.repository.ChatRepository;
import com.goodee.coreconnect.chat.repository.ChatRoomRepository;
import com.goodee.coreconnect.chat.repository.ChatRoomUserRepository;
import com.goodee.coreconnect.chat.repository.MessageFileRepository;
import com.goodee.coreconnect.chat.handler.ChatWebSocketHandler;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatRoomServiceImpl implements ChatRoomService {

    private final AccountLogRepository accountLogRepository;

	private final ChatRoomUserRepository chatRoomUserRepository;
	private final ChatRoomRepository chatRoomRepository;
	private final ChatRepository chatRepository;
	private final NotificationRepository notificationRepository;
	private final UserRepository userRepository;
	private final DocumentRepository documentRepository;
	private final MessageFileRepository messageFileRepository;
    private final ChatMessageReadStatusRepository chatMessageReadStatusRepository;
    private final ApplicationEventPublisher eventPublisher;
    
	@Transactional(readOnly = true)
	@Override
	public List<Integer> getParticipantIds(Integer roomId) {
		List<ChatRoomUser> users = chatRoomUserRepository.findByChatRoomId(roomId);
		return users.stream()
				.map(chatRoomUser -> chatRoomUser.getUser().getId())
				.collect(Collectors.toList());
	}

	@Override
	public List<String> getParticipantEmail(Integer roomId) {
		List<ChatRoomUser> users = chatRoomUserRepository.findByChatRoomIdWithUser(roomId);
		return users.stream()
				.map(chatRoomUser -> chatRoomUser.getUser().getEmail())
				.collect(Collectors.toList());
	}

	@Transactional
	public ChatRoom createChatRoom(String roomName, List<Integer> userIds,  String email ) {
		User drafter = findUserByEmail(email);
		
	    String roomType = (userIds.size() == 1) ? "alone" : "group";
	    Boolean favoriteStatus = false;
		
	    ChatRoom chatRoom = ChatRoom.createChatRoom(roomName, roomType, favoriteStatus, drafter);

		chatRoomRepository.save(chatRoom);
		
		for (Integer userID : userIds) {
			User user = userRepository.findById(userID).orElseThrow();
			ChatRoomUser chatRoomUser = ChatRoomUser.createChatRoomUser(user, chatRoom);
			chatRoomUserRepository.save(chatRoomUser);
			chatRoom.getChatRoomUsers().add(chatRoomUser);
			user.getChatRoomUsers().add(chatRoomUser);
		}
		return chatRoom;		
	}

	

	@Override
	public ChatRoom findById(Integer id) {
		return chatRoomRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("채팅방 없음: "  + id));
	}

	@Transactional
	@Override
	public ChatRoom updateRoomType(int roomId, String roomType) {
		ChatRoom chatRoom = chatRoomRepository.findById(roomId)
				.orElseThrow(() -> new IllegalArgumentException("채팅방 없음: " + roomId));
		chatRoom.changeRoomType(roomType);
		return chatRoomRepository.save(chatRoom);
	}

	@Transactional
	@Override
	public List<Notification> saveNotification(Integer roomId, Integer senderId, String content, NotificationType notificationType, Document document) {
		log.info("CHAT: content: {}", content);
	    
		// 채팅방 객체 선언
		ChatRoom chatRoom = null;
		
		// roomId가 있으면
	    if (roomId != null) {
	        chatRoom = chatRoomRepository.findById(roomId)
	                .orElseThrow(() -> new IllegalArgumentException("채팅방 없음: " + roomId));
	    }

	    User sender = userRepository.findById(senderId)
	            .orElseThrow(() -> new IllegalArgumentException("사용자 없음: " + senderId));

	    // 결과로 반환할 알림 목록
	    List<Notification> notifications = new ArrayList<>();

	    // 이제 EMAIL, NOTICE, APPROVAL, SCHEDULE만 처리
	    List<User> recipients = new ArrayList<>();
	    
	    // 채팅방이 있으면 
	    if (chatRoom != null) {
	    	List<ChatRoomUser> participants = chatRoomUserRepository.findByChatRoomId(roomId);
	    	for (ChatRoomUser chatRoomUser : participants) {
	    		User user = chatRoomUser.getUser();
	    		if ( user == null) continue;
	    		if (user.getId().equals(sender.getId())) continue;
	    		recipients.add(user);
	    	}	    	
	    } else {
	    	recipients.add(sender);
	    }
	    
	    String defaultMsg;
	    switch(notificationType) {
		    case EMAIL:
	            defaultMsg = sender.getName() + "님으로부터 이메일이 도착했습니다.";
	            break;
	        case NOTICE:
	            defaultMsg = sender.getName() + "님이 공지를 등록했습니다.";
	            break;
	        case APPROVAL:
	            defaultMsg = sender.getName() + "님이 전자결재 문서를 등록했습니다.";
	            break;
	        case SCHEDULE:
	            defaultMsg = sender.getName() + "님이 일정을 등록했습니다.";
	            break;
	        default:
	            defaultMsg = sender.getName() + "님으로부터 새로운 알림이 있습니다.";
	            break;
	    }
	    
	    // 수신자별 알림 생성
	    for (User recipient : recipients) {
	    	// 실제 사용할 메시지
	    	String messageToUse = defaultMsg;
	    	if (notificationType == NotificationType.EMAIL && content != null && !content.isBlank()) {
	    		messageToUse = content;
	    	}
	    	
	    	Notification notification;
	    	if ((notificationType == NotificationType.APPROVAL || notificationType == NotificationType.SCHEDULE) && document != null) {
	    		 notification = Notification.createNotification(
	                     recipient,
	                     notificationType,
	                     messageToUse,
	                     null,
	                     document,
	                     false,
	                     false,
	                     false,
	                     LocalDateTime.now(),
	                     null,
	                     sender
	             );
	    		
	    	} else {
	    		 notification = Notification.createNotification(
	                     recipient,
	                     notificationType,
	                     messageToUse,
	                     null,
	                     null,
	                     false,
	                     false,
	                     false,
	                     LocalDateTime.now(),
	                     null,
	                     sender
	             );	
	    	}
	    	
	    	 notificationRepository.save(notification);
	         notifications.add(notification);
	    }
	    

	    // [수정] Notification 엔티티 → NotificationPayload DTO 리스트로 변환
	    try {
	    	// Notification 엔티티 리스트를 NotificationPayload DTO 리스트로 변환
	        List<NotificationPayload> payloads = notifications.stream().map(n -> {
	        	// DTO 인스턴스 생성
	            NotificationPayload p = new NotificationPayload();
	            // 알림의 고유 ID 설정
	            p.setNotificationId(n.getId());
	            // 알림 수신자 ID 설정 (수신자 정보가 있으면 그 ID, 없으면 null)
	            p.setRecipientId(n.getUser() != null ? n.getUser().getId() : null);
	            // 채팅 알림일 경우 Chat 엔티티의 ID 설정, 아니면 null
	            p.setChatId(n.getChat() != null ? n.getChat().getId() : null);
	            // 채팅 알림일 경우 ChatRoom의 ID 설정, 아니면 null
	            p.setRoomId((n.getChat() != null && n.getChat().getChatRoom() != null) ? n.getChat().getChatRoom().getId() : null);
	            // 발신자 정보가 있으면 그 ID, 없으면 null
	            p.setSenderId((n.getChat() != null && n.getChat().getSender() != null) ? n.getChat().getSender().getId() : null);
	            // 발신자 정보가 있으면 그 이름, 없으면 null
	            p.setSenderName((n.getChat() != null && n.getChat().getSender() != null) ? n.getChat().getSender().getName() : null);
	            // 알림 메시지 내용 설정
	            p.setMessage(n.getNotificationMessage());
	            // 알림 타입(EMAIL, NOTICE, APPROVAL, SCHEDULE 등) 설정
	            p.setNotificationType(n.getNotificationType() != null ? n.getNotificationType().name() : null);
	            // 알림 전송 시각 설정 (값이 없으면 현재 시각으로 대체)
	            p.setCreatedAt(n.getNotificationSentAt() != null ? n.getNotificationSentAt() : LocalDateTime.now());
	            return p;
	        }).collect(Collectors.toList());

	        // 알림 생성 이벤트 발행 (리스너가 실시간 푸시 등 처리 가능)
	        eventPublisher.publishEvent(new NotificationCreatedEvent(this, payloads));
	    } catch (Exception e) {
	    	
	    	// 이벤트 발행 또는 변환 실패 시 경고 로그 출력
	        log.warn("NotificationCreatedEvent publish failed: {}", e.getMessage(), e);
	    }

	    return notifications;
	}

	@Override
	public void sendNotification(NotificationRequestDTO dto) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void deleteDocumentAndNotification(Integer documentId) {
		Document document = documentRepository.findById(documentId)
				.orElseThrow(() -> new IllegalArgumentException("문서 없음: " + documentId));
		document.markDeleted(true);
		documentRepository.save(document);

		List<Notification> notifications = notificationRepository.findByDocumentId(documentId);
		for (Notification notification : notifications) {
		    notification.markDeleted(); 
		    notificationRepository.save(notification);
		}
	}
	
	private User findUserByEmail(String email) {
		return userRepository.findByEmail(email)
				.orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다. Email: " + email));
		
	}

	@Override
	public List<ChatRoomUser> getChatRoomUsers(Integer roomId) {
		// ⭐ User와 Department를 함께 조회하여 Lazy Loading 문제 해결
		return chatRoomUserRepository.findByChatRoomIdWithUser(roomId);
	}

	@Override
	public List<ChatRoomLatestMessageResponseDTO> getChatRoomIdsByUserId(Integer userId) {
		// 내가 참여중인 채팅방 엔티티 리스트 조회
		List<ChatRoomUser> chatRoomUsers = chatRoomUserRepository.findByUserId(userId);
		List<ChatRoom> chatRooms = chatRoomUsers.stream()
	            .map(ChatRoomUser::getChatRoom)
	            .distinct()
	            .collect(Collectors.toList());

	    // 2. 각 채팅방별 마지막 메시지 조회
	    List<ChatRoomLatestMessageResponseDTO> result = new ArrayList<>();
	    for (ChatRoom room : chatRooms) {
	        Chat lastMessage = room.getChats().stream()
	                .max(Comparator.comparing(Chat::getSendAt))
	                .orElse(null);

	        result.add(ChatRoomLatestMessageResponseDTO.builder()
	                .roomId(room.getId())
	                .roomName(room.getRoomName())
	                .lastMessageId(lastMessage != null ? lastMessage.getId() : null)
	                .lastMessageContent(lastMessage != null ? lastMessage.getMessageContent() : null)
	                .lastSenderName(lastMessage != null && lastMessage.getSender() != null ? lastMessage.getSender().getName() : null)
	                .lastMessageTime(lastMessage != null ? lastMessage.getSendAt() : null)
	                .build());
	    }
		
		return result;
	}

	@Transactional
	@Override
	public Chat sendChatMessage(Integer roomId, Integer senderId, Object contentOrFile) {
		// 1. 채팅방/사용자 조회
		ChatRoom chatRoom = chatRoomRepository.findById(roomId).orElseThrow(() -> new IllegalArgumentException("채팅방 없음: " + roomId));
		User sender = userRepository.findById(senderId)
	            .orElseThrow(() -> new IllegalArgumentException("사용자 없음: " + senderId));
		
		Chat chat;
		if (contentOrFile instanceof String) {
		    // 텍스트 메시지 저장
		    chat = Chat.createChat(chatRoom, sender, (String) contentOrFile, false, null, LocalDateTime.now());
		} else if (contentOrFile instanceof MessageFile) {
			// 파일 메시지 저장
			chat = Chat.createChat(chatRoom, sender, null, true, null, LocalDateTime.now());
			chat = chatRepository.save(chat);
			
			MessageFile file = (MessageFile) contentOrFile;
			// 파일에 chat 연결
			file = MessageFile.createMessageFile(file.getFileName(), file.getFileSize(), file.getS3ObjectKey(), chat);
			
			// chat의 파일리스트에 파일 추가 (양방향 매핑)
			chat.getMessageFiles().add(file);
			
			// 파일 저장
			messageFileRepository.save(file);
		} else {
			throw new IllegalArgumentException("지원하지 않는 타입");
		}
		
		chat = chatRepository.save(chat);
		
		// 여기에서 ChatMessageReadStatus 저장
		// 2. 참여자별 읽음 상태 생성 (알림용 Notification 테이블 사용하지 않음)
	    List<ChatRoomUser> participants = chatRoomUserRepository.findByChatRoomId(roomId);
	    
	    // ⭐ 정책: "발신자 + 접속 중인 사용자는 모두 읽음 처리, 나머지는 unread"
	    // 실시간 채팅방에 접속해 있는 사용자들은 메시지를 바로 볼 수 있으므로 읽음 처리
	    
	    // ⭐ 현재 채팅방에 접속 중인 사용자 목록 조회 (실시간 WebSocket 세션 기반)
	    // ⭐ userId 기준 접속자 집계: 같은 userId의 여러 브라우저/탭은 1명으로 집계
	    log.info("🔥 [sendChatMessage] ========== 접속자 조회 시작 ========== roomId: {}", roomId);
	    List<Integer> connectedUserIds = getConnectedUserIdsInRoom(roomId);
	    
	    // ⭐ 디버깅: 접속 중인 사용자 상세 정보
	    log.info("🔥 [sendChatMessage] ⭐ 실시간 접속자 조회 (userId 기준) - roomId: {}, 접속자수: {}, 접속자Ids: {}", 
	            roomId, connectedUserIds.size(), connectedUserIds);
	    
	    // ⭐ 디버깅: 참여자 목록 확인
	    log.info("[sendChatMessage] 참여자 목록 조회 - roomId: {}, 참여자수: {}, 발신자Id: {}", 
	            roomId, participants.size(), sender.getId());
	    
	    int savedCount = 0;
	    int senderReadCount = 0;
	    int connectedReadCount = 0;
	    int otherReadCount = 0;
	    
	    for (ChatRoomUser cru : participants) {
	        User participant = cru.getUser();
	        
	        // ⭐ 참여자 정보 확인
	        if (participant == null) {
	            log.warn("[sendChatMessage] 참여자 정보가 null입니다 - cru.id: {}", cru.getId());
	            continue;
	        }
	        
	        // ⭐ 중복 체크: 이미 해당 chat과 user에 대한 row가 있는지 확인
	        Optional<ChatMessageReadStatus> existingStatusOpt = chatMessageReadStatusRepository
	                .findByChatIdAndUserId(chat.getId(), participant.getId());
	        
	        ChatMessageReadStatus readStatus;
	        boolean isNew = false;
	        
	        if (existingStatusOpt.isPresent()) {
	            // ⭐ 이미 존재하는 경우 기존 row 사용 (복합키로 인해 자동으로 update됨)
	            readStatus = existingStatusOpt.get();
	            log.debug("[sendChatMessage] 이미 존재하는 ChatMessageReadStatus 발견 - 기존 row 사용 - userId: {}, chatId: {}, readYn: {}", 
	                    participant.getId(), chat.getId(), readStatus.getReadYn());
	            // ⭐ 기존 row의 readYn 상태 초기화 (새 메시지이므로)
	            readStatus.resetReadStatus();
	        } else {
	            // ⭐ 새로 생성
	            readStatus = ChatMessageReadStatus.create(chat, participant);
	            isNew = true;
	        }
	        
	        // ⭐ 정책: 발신자 + 접속 중인 사용자는 모두 읽음 처리, 나머지는 unread
	        boolean isSender = participant.getId().equals(sender.getId());
	        boolean isConnected = connectedUserIds.contains(participant.getId());
	        
	        if (isSender) {
	            // ⭐ 발신자는 읽음 처리
	            readStatus.markRead();
	            senderReadCount++;
	            log.debug("[sendChatMessage] 발신자 읽음 처리 - userId: {}, chatId: {}", 
	                    participant.getId(), chat.getId());
	        } else if (isConnected) {
	            // ⭐ 접속 중인 사용자는 자동으로 읽음 처리 (실시간으로 메시지를 볼 수 있으므로)
	            readStatus.markRead();
	            connectedReadCount++;
	            log.debug("[sendChatMessage] 접속 중인 사용자 읽음 처리 - userId: {}, chatId: {}", 
	                    participant.getId(), chat.getId());
	        } else {
	            // ⭐ 발신자가 아니고 접속 중이 아닌 경우 readYn=false
	            otherReadCount++;
	            log.debug("[sendChatMessage] 참여자 읽음 상태 생성 - userId: {}, chatId: {}, readYn: false", 
	                    participant.getId(), chat.getId());
	        }
	        
	        try {
	            ChatMessageReadStatus saved = chatMessageReadStatusRepository.save(readStatus);
	            savedCount++;
	            log.debug("[sendChatMessage] ChatMessageReadStatus 저장 완료 - userId: {}, chatId: {}, readYn: {}, isNew: {}", 
	                    participant.getId(), chat.getId(), saved.getReadYn(), isNew);
	        } catch (Exception e) {
	            log.error("[sendChatMessage] ChatMessageReadStatus 저장 실패 - userId: {}, chatId: {}, error: {}", 
	                    participant.getId(), chat.getId(), e.getMessage(), e);
	            throw e; // 예외를 다시 던져서 트랜잭션 롤백
	        }
	    }
	    
	    // ⭐ 디버깅: 저장 결과 확인
	    log.info("[sendChatMessage] ChatMessageReadStatus 저장 완료 - chatId: {}, 총참여자수: {}, 저장된row수: {}, 발신자(readYn=true): {}, 접속중(readYn=true): {}, 미접속(readYn=false): {}", 
	            chat.getId(), participants.size(), savedCount, senderReadCount, connectedReadCount, otherReadCount);
	    
	    // ⭐ 저장된 row 수가 참여자 수와 일치하는지 확인
	    if (savedCount != participants.size()) {
	        log.error("[sendChatMessage] ⚠️ 경고: 저장된 row 수가 참여자 수와 일치하지 않습니다! - chatId: {}, 참여자수: {}, 저장된row수: {}", 
	                chat.getId(), participants.size(), savedCount);
	    }
	    
	    // ⭐ ChatMessageReadStatus 저장 후 즉시 DB에 반영 (flush)
	    // 이렇게 하면 메시지 전송 후 바로 unreadCount를 계산할 수 있음
	    chatMessageReadStatusRepository.flush();
	    
	    // ⭐ flush 후 실제 DB에 저장된 row 수 확인
	    // 각 참여자에 대해 row가 생성되었는지 확인
	    int actualRowCount = 0;
	    for (ChatRoomUser cru : participants) {
	        Optional<ChatMessageReadStatus> statusOpt = chatMessageReadStatusRepository
	                .findByChatIdAndUserId(chat.getId(), cru.getUser().getId());
	        if (statusOpt.isPresent()) {
	            actualRowCount++;
	            ChatMessageReadStatus status = statusOpt.get();
	            log.debug("[sendChatMessage] DB 확인 - userId: {}, chatId: {}, readYn: {}", 
	                    cru.getUser().getId(), chat.getId(), status.getReadYn());
	        } else {
	            log.error("[sendChatMessage] ⚠️ DB에 row가 없습니다! - userId: {}, chatId: {}", 
	                    cru.getUser().getId(), chat.getId());
	        }
	    }
	    
	    log.info("[sendChatMessage] flush 후 실제 DB row 수 확인 - chatId: {}, 실제row수: {}, 예상row수: {}", 
	            chat.getId(), actualRowCount, participants.size());
	    
	    if (actualRowCount != participants.size()) {
	        log.error("[sendChatMessage] ⚠️ 심각한 문제: flush 후 실제 DB row 수가 참여자 수와 일치하지 않습니다! - chatId: {}, 참여자수: {}, 실제row수: {}", 
	                chat.getId(), participants.size(), actualRowCount);
	    }
	    
	    // ⭐ unreadCount 계산: 브로드캐스트 직전에 항상 DB에서 최신 값 조회
	    // 정책: "발신자 + 접속 중인 사용자는 모두 읽음 처리, 나머지는 unread"
	    // ⭐ 중요: flush 후 실제 DB에서 countUnreadByChatId로 최신 값을 가져와야 함
	    // 이렇게 해야 race condition 없이 정확한 unreadCount를 브로드캐스트할 수 있음
	    
	    // ⭐ ChatMessageReadStatus 저장 및 flush 완료 후, 실제 DB에서 최신 unreadCount 조회
	    int confirmedUnreadCount = chatMessageReadStatusRepository.countUnreadByChatId(chat.getId());
	    
	    // ⭐ 참여자 수 및 접속자 수 확인 (디버깅용)
	    int totalParticipants = participants.size();
	    int connectedUsersCount = connectedUserIds.size(); // 현재 접속 중인 사용자 수 (발신자 포함)
	    
	    // ⭐ unreadCount는 0 이상이어야 함
	    if (confirmedUnreadCount < 0) {
	        log.warn("[sendChatMessage] ⚠️ unreadCount가 음수입니다! - 총참여자수: {}, 접속중인사용자수: {}, unreadCount: {}", 
	                totalParticipants, connectedUsersCount, confirmedUnreadCount);
	        confirmedUnreadCount = 0;
	    }
	    
	    log.info("[sendChatMessage] ⭐ unreadCount 최신 DB 조회 (flush 후) - chatId: {}, 총참여자수: {}, 접속중인사용자수: {}, 최신unreadCount: {}", 
	            chat.getId(), totalParticipants, connectedUsersCount, confirmedUnreadCount);
	    
	    // ⭐ Chat 엔티티에 최신 DB 값 설정
	    chat.setUnreadCount(confirmedUnreadCount);
	    chatRepository.save(chat);
	    
	    // ⭐ Chat 엔티티 저장 후 flush (일관성 유지)
	    chatRepository.flush();
		
		return chat;
	}

	@Override
	public List<Integer> getLatestMessagesByUserId(Integer userId) {
		 List<ChatRoomLatestMessageResponseDTO> roomInfos = getChatRoomIdsByUserId(userId);
		    return roomInfos.stream()
		            .map(ChatRoomLatestMessageResponseDTO::getRoomId)
		            .distinct()
		            .collect(Collectors.toList());
	}

	

	@Override
	public List<Notification> getNotificationsByUserId(Integer userId) {
		return notificationRepository.findByUserIdOrderBySentAtDesc(userId);
	}

	@Override
	public int countUnreadByChatId(Integer chatId) {
		return chatMessageReadStatusRepository.countUnreadByChatId(chatId);

	}

	@Override
	public List<Object[]> countUnreadByRoomId(Integer roomId) {
		return chatMessageReadStatusRepository.countUnreadByRoomId(roomId);
	}
	
	@Transactional(readOnly = true)
    @Override
    public List<ChatRoomSummaryResponseDTO> getChatRoomSummariesByUserId(Integer userId) {
        // 1. 내가 참여중인 채팅방 ID 목록
        List<Integer> roomIds = chatRoomUserRepository.findByUserId(userId)
                .stream()
                .map(cru -> cru.getChatRoom().getId())
                .distinct()
                .collect(Collectors.toList());

        // 2. 각 채팅방별 내가 안읽은 메시지 개수 조회
        List<Object[]> unreadCounts = chatMessageReadStatusRepository.countUnreadByRoomIdForUser(userId);
        Map<Integer, Integer> unreadCountMap = new HashMap<>();
        for (Object[] arr : unreadCounts) {
            unreadCountMap.put((Integer) arr[0], ((Long) arr[1]).intValue());
        }

        // 3. 각 채팅방의 최신 메시지 조회
        List<Chat> lastMessages = chatRepository.findLatestMessagesByRoomIds(roomIds);
        Map<Integer, Chat> lastMessageMap = lastMessages.stream()
                .collect(Collectors.toMap(
                        chat -> chat.getChatRoom().getId(),
                        chat -> chat
                ));

        // 4. 각 채팅방의 이름 조회
        Map<Integer, String> roomNameMap = chatRoomRepository.findAllById(roomIds)
                .stream()
                .collect(Collectors.toMap(ChatRoom::getId, ChatRoom::getRoomName));

        // 5. 결과 DTO 생성
        List<ChatRoomSummaryResponseDTO> result = new ArrayList<>();
        for (Integer roomId : roomIds) {
            Chat lastMsg = lastMessageMap.get(roomId);
            result.add(ChatRoomSummaryResponseDTO.builder()
                    .roomId(roomId)
                    .roomName(roomNameMap.get(roomId))
                    .unreadCount(unreadCountMap.getOrDefault(roomId, 0))
                    .lastMessageId(lastMsg != null ? lastMsg.getId() : null)
                    .lastMessageContent(lastMsg != null ? lastMsg.getMessageContent() : null)
                    .lastSenderName(lastMsg != null && lastMsg.getSender() != null ? lastMsg.getSender().getName() : null)
                    .lastMessageTime(lastMsg != null ? lastMsg.getSendAt() : null)
                    .build());
        }
        return result;
    }
	
	// 읽음 업데이트
	// 채팅방에 참여자가 여러명일 떄, 누군가 메시지를 읽거나 메시지를 또 보내면 chat_message_read_status의 이전 메시지들도 읽음 처리와 읽은 시간 업데이트가 되어야 함
	// ⭐ 각 메시지의 unreadCount를 -1 감소시키는 로직 추가
	@Transactional
	public List<Integer> markMessagesAsRead(Integer roomId, Integer userId) {
	    // 1. 해당 채팅방에서 내가 안읽은 메시지 상태 전부 조회
	    List<ChatMessageReadStatus> unreadStatuses =
	        chatMessageReadStatusRepository.findUnreadMessagesByRoomIdAndUserId(roomId, userId);

	    // ⭐ 읽음 처리된 메시지 ID 리스트 (unreadCount 업데이트용)
	    List<Integer> readChatIds = new ArrayList<>();

	    // 2. 상태를 모두 읽음 처리 및 시간 업데이트
	    for (ChatMessageReadStatus status : unreadStatuses) {
	    	// 확실히 안읽음 상태일 때만 markRead() 수행
	    	if (Boolean.FALSE.equals(status.getReadYn()) && status.getReadAt() == null) {
	    		status.markRead();// 내부적으로 readYn = true, readAt= now로 세팅
	    		chatMessageReadStatusRepository.save(status);
	    		
	    		// ⭐ 읽음 처리된 메시지 ID 추가
	    		if (status.getChat() != null && status.getChat().getId() != null) {
	    			readChatIds.add(status.getChat().getId());
	    		}
	    	}
	    	
	    	// 불일치 row 강제 동기화 (optional)
	        if (status.getReadAt() != null && Boolean.FALSE.equals(status.getReadYn())) {
	            status.markRead();
	            chatMessageReadStatusRepository.save(status);
	            
	            // ⭐ 읽음 처리된 메시지 ID 추가
	            if (status.getChat() != null && status.getChat().getId() != null) {
	            	readChatIds.add(status.getChat().getId());
	            }
	        }
	    }
	    
	    // ⭐ ChatMessageReadStatus 읽음 처리 후 즉시 DB에 반영 (flush)
	    // 이렇게 하면 바로 unreadCount를 실시간으로 계산할 수 있음
	    chatMessageReadStatusRepository.flush();
	    
	    // ⭐ 3. 각 메시지의 unreadCount를 -1 감소시키기 (DB 동기화용, 실제로는 실시간 계산값 사용)
	    for (Integer chatId : readChatIds) {
	        Optional<Chat> chatOpt = chatRepository.findById(chatId);
	        if (chatOpt.isPresent()) {
	            Chat chat = chatOpt.get();
	            Integer currentUnreadCount = chat.getUnreadCount() != null ? chat.getUnreadCount() : 0;
	            // unreadCount가 0보다 클 때만 -1 감소
	            if (currentUnreadCount > 0) {
	                chat.setUnreadCount(currentUnreadCount - 1);
	                chatRepository.save(chat);
	            }
	        }
	    }
	    
	    // ⭐ 읽음 처리된 메시지 ID 리스트 반환 (WebSocket 알림용)
	    return readChatIds;
	}

	/**
	 * 채팅방에서 현재 접속 중인 인원 id 리스트 반환
	 * ⭐ 실시간 WebSocket 세션 상태를 기반으로 정확한 접속자 수를 반환
	 * 
	 * 핵심: afterConnectionClosed에서 userSessions.remove(userId)가 제대로 호출되어야
	 *       이 메서드가 정확한 실시간 접속자 수를 반환할 수 있음!
	 * 
	 * @param roomId 채팅방 ID
	 * @return 접속 중인 사용자 ID 목록 (발신자 포함)
	 */
    @Override
    public List<Integer> getConnectedUserIdsInRoom(Integer roomId) {
        // ⭐ 순환 참조 방지: ChatWebSocketHandler의 static 메서드를 직접 호출
        // ChatWebSocketHandler는 ChatRoomService를 주입받고,
        // ChatRoomServiceImpl은 ChatWebSocketHandler를 주입받으려고 하면 순환 참조 발생
        // 따라서 static 메서드를 통해 userSessions에 직접 접근
        List<Integer> connectedUserIds = com.goodee.coreconnect.chat.handler.ChatWebSocketHandler.getConnectedUserIdsInRoomStatic(roomId);
        
        log.info("[ChatRoomService.getConnectedUserIdsInRoom] roomId: {}, 접속자수: {}, 접속자Ids: {}", 
                roomId, connectedUserIds.size(), connectedUserIds);
        
        return connectedUserIds;
    }

    /** 각 메시지별 안읽은 인원 수 DB 업데이트(필요시 사용) */
    @Override
    public void updateUnreadCountForMessages(Integer roomId) {
        
    	// 현재 채팅방에 접속중인 사용자 id 리스트 확보
    	List<Integer> connectedUserIds = getConnectedUserIdsInRoom(roomId);
    	log.info("connectedUserIds: {}", connectedUserIds);
    	
    	// 각 접속중인 사용자에 대해 미읽은 메시지 읽음 처리
    	for (Integer userId : connectedUserIds) {
    		chatMessageReadStatusRepository.markMessagesAsReadInRoomForUser(roomId, userId, LocalDateTime.now());
    	}
    	
    	
    	// 각 메시지별로 readYn=false인 인원 수 집계
        List<Object[]> unreadCounts = chatMessageReadStatusRepository.countUnreadByRoomId(roomId);
        Map<Integer, Integer> unreadCountMap = new HashMap<>();
        for (Object[] arr : unreadCounts) {
            Integer chatId = (Integer) arr[0];
            Integer unreadCount = ((Long) arr[1]).intValue();
            unreadCountMap.put(chatId, unreadCount);
        }

        // 모든 메시지를 가져와서 unreadCount 필드를 업데이트
        List<Chat> allChats = chatRepository.findByChatRoomId(roomId);
        for (Chat chat : allChats) {
            Integer count = unreadCountMap.getOrDefault(chat.getId(), 0);
            chat.setUnreadCount(count); // 엔티티 필드에 값 설정
            chatRepository.save(chat);  // DB에 저장/업데이트
        }

        log.debug("RoomId {}: 각 메시지별 unreadCount DB에 저장 완료", roomId);
    }
    

    @Override
    public List<UnreadNotificationListDTO> getUnreadNotificationsExceptLatest(
        Integer userId, List<NotificationType> allowedTypes) {

        List<Notification> unreadList = notificationRepository.findUnreadByUserIdAndTypesOrderBySentAtDesc(userId, allowedTypes);

        // 디버깅 로그 추가
        log.info("unreadList.size: {}", unreadList.size());
        unreadList.forEach(n -> log.info("NotificationId: {}, ReadYn: {}, DeletedYn: {}, UserId: {}, Type: {}",
                n.getId(), n.getNotificationReadYn(), n.getNotificationDeletedYn(), n.getUser().getId(), n.getNotificationType()));

        // 리스트가 2개 이상일 때만, 가장 최근 알림 제외
        if (unreadList.size() <= 1) return List.of();
        return unreadList.subList(1, unreadList.size())
                .stream()
                .map(UnreadNotificationListDTO::from)
                .collect(Collectors.toList());
    }

    @Override
    public ChatResponseDTO saveChatAndReturnDTO(Integer roomId, Integer senderId, String content, int unreadCount) {
        Chat chat = sendChatMessage(roomId, senderId, content); // chat 저장
        // unreadCount 반영
        chat.setUnreadCount(unreadCount);
        // Lazy 필드 강제 초기화(필요시)
        chat.getSender().getName();
        chat.getChatRoom().getId();
        log.info("sendAt: {}", chat.getSendAt());
        // DB에 저장
        chatRepository.save(chat);

        // 반드시 fromEntity를 통해 String sendAt을 넣어준다!
        ChatResponseDTO dto = ChatResponseDTO.fromEntity(chat);
        
        // ⭐ senderEmail 명시적으로 설정 (lazy loading 문제 해결)
        // fromEntity에서 chat.getSender().getEmail()이 null일 수 있으므로 명시적으로 설정
        // senderId로 User를 조회하여 email 가져오기
        if (dto != null && senderId != null) {
            User sender = userRepository.findById(senderId).orElse(null);
            if (sender != null && sender.getEmail() != null) {
                dto.setSenderEmail(sender.getEmail());
                log.debug("[saveChatAndReturnDTO] senderEmail 설정 - userId: {}, email: {}", senderId, sender.getEmail());
            } else {
                log.warn("[saveChatAndReturnDTO] senderEmail 설정 실패 - userId: {}, sender가 null이거나 email이 null", senderId);
            }
        }
        
        return dto;
    }

	@Transactional
	@Override
	public String getUnreadToadMsgForUser(Integer offlineUserId) {
		List<ChatMessageReadStatus> unreadMessages = chatMessageReadStatusRepository.fetchUnreadWithSender(offlineUserId);
	    int unreadChatCount = unreadMessages.size();
	    if (unreadChatCount > 0) {
	        ChatMessageReadStatus status = unreadMessages.get(0);
	        // 아래 LAZY 접근은 트랜잭션 내이므로 OK!
	        String senderName = status.getChat().getSender().getName();
	        return senderName + "님으로부터 " + unreadChatCount + "개의 채팅 메시지가 도착했습니다";
	    }
	    return null;
	}

	@Override
	public List<Chat> getChatsWithFilesByRoomId(Integer roomId) {
		List<Chat> chats = chatRepository.findAllChatsWithFilesByRoomId(roomId);
		if (chats == null || chats.isEmpty()) {
			throw new IllegalArgumentException("채팅 메시지 없음: " + roomId);
		} 
		
		
		return chats;
	}
	
	@Override
	public org.springframework.data.domain.Page<Chat> getChatsWithFilesByRoomIdPaged(Integer roomId, org.springframework.data.domain.Pageable pageable) {
		return chatRepository.findChatsWithFilesByRoomIdPaged(roomId, pageable);
	}

	@Override
	public boolean existsRoom(Integer roomId) {
		 if (roomId == null) return false;
	    // JPA repository 활용 예시: chatRoomRepository.existsById(roomId)
	    // chatRoomRepository는 보통 JpaRepository<ChatRoom, Integer>
	    return chatRoomRepository.existsById(roomId);
	}

	@Override
	public List<ChatRoomListDTO> getChatRoomListWithUnreadCount(Integer userId) {
	    // 1. 내가 참여하는 채팅방 목록 (ID만 추출)
	    List<ChatRoomUser> chatRoomUsers = chatRoomUserRepository.findByUserId(userId);
	    List<ChatRoom> chatRooms = chatRoomUsers.stream()
	        .map(ChatRoomUser::getChatRoom)
	        .distinct()
	        .collect(Collectors.toList());
	    List<Integer> roomIds = chatRooms.stream()
	        .map(ChatRoom::getId)
	        .collect(Collectors.toList());

	    // 2. 각 채팅방별 unread 개수 매핑
	    List<Object[]> unreadCounts = chatMessageReadStatusRepository.countUnreadMessagesByUserId(userId);
	    Map<Integer, Long> roomIdToUnreadCount = unreadCounts.stream()
	        .collect(Collectors.toMap(row -> (Integer)row[0], row -> (Long)row[1]));

	    // 3. 각 채팅방별 마지막 메시지를 쿼리로 batch 조회
	    List<Chat> lastMessages = chatRepository.findLatestMessageByChatRoomIds(roomIds);
	    Map<Integer, Chat> roomIdToLastMessage = lastMessages.stream()
	    		.collect(Collectors.toMap(chat -> chat.getChatRoom().getId(), chat -> chat));
	    
	    
	    // 4. DTO 변환
	    List<ChatRoomListDTO> dtos = new ArrayList<>();
	    for (ChatRoom room : chatRooms) {
	        Chat lastMessage = roomIdToLastMessage.get(room.getId());
	        long unreadCount = roomIdToUnreadCount.getOrDefault(room.getId(), 0L);
	        dtos.add(new ChatRoomListDTO(
	            room.getId(),
	            room.getRoomName(),
	            lastMessage != null ? lastMessage.getMessageContent() : null,
	            lastMessage != null ? lastMessage.getSendAt() : null,
	            lastMessage != null && lastMessage.getSender() != null ? lastMessage.getSender().getName() : null,
	            unreadCount
	        ));
	    }
	    return dtos;
	}

	@Override
	public boolean existsByRoomId(Integer roomId) {
	    // JPA를 사용한다면 repository의 existsById를 활용
	    return chatRoomRepository.existsById(roomId);

	    // 만약 MyBatis나 직접 쿼리라면 아래처럼 작성! (주석 해제 후 사용)
	    // return chatRoomMapper.countByRoomId(roomId) > 0;
	}
	
	

    
}