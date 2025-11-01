package com.goodee.coreconnect.chat.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.socket.WebSocketSession;

import com.goodee.coreconnect.chat.event.NotificationCreatedEvent;
import com.goodee.coreconnect.chat.handler.ChatWebSocketHandler;
import com.goodee.coreconnect.common.dto.request.NotificationRequestDTO;
import com.goodee.coreconnect.common.entity.Notification;
import com.goodee.coreconnect.common.notification.dto.NotificationPayload; // DTO import 추가
import com.goodee.coreconnect.common.notification.enums.NotificationType;
import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.approval.repository.DocumentRepository;
import com.goodee.coreconnect.chat.dto.response.ChatRoomLatestMessageResponseDTO;
import com.goodee.coreconnect.chat.dto.response.ChatRoomSummaryResponseDTO;
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
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatRoomServiceImpl implements ChatRoomService {

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
	public ChatRoom createChatRoom(String name, List<Integer> userIds,  String email ) {
		User drafter = findUserByEmail(email);
		
	    String roomType = (userIds.size() == 1) ? "alone" : "group";
	    Boolean favoriteStatus = false;
		
	    ChatRoom chatRoom = ChatRoom.createChatRoom(name, roomType, favoriteStatus, drafter);

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
				.orElseThrow(() -> new IllegalArgumentException("채팅방 없음: " + id));
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
		return chatRoomUserRepository.findByChatRoomId(roomId);
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
	    for (ChatRoomUser cru : participants) {
	        User participant = cru.getUser();
	        ChatMessageReadStatus readStatus = ChatMessageReadStatus.create(chat, participant);
	        // 만약 발신자라면 바로 읽음 처리
	        if (participant.getId().equals(sender.getId())) {
	            readStatus.markRead();
	        }
	        chatMessageReadStatusRepository.save(readStatus);
	    }
		
		
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
	// 채팅방에 참여자가 여러명일 떄, 누군가 메시지를 읽거나 메시지를 또 보내면 chat_message_read_status의 이전 메시지들도 읽음 처리와 ㄱ읽은 시간 업데이트가 되어야 함
	@Transactional
	public void markMessagesAsRead(Integer roomId, Integer userId) {
	    // 1. 해당 채팅방에서 내가 안읽은 메시지 상태 전부 조회
	    List<ChatMessageReadStatus> unreadStatuses =
	        chatMessageReadStatusRepository.findUnreadMessagesByRoomIdAndUserId(roomId, userId);

	    // 2. 상태를 모두 읽음 처리 및 시간 업데이트
	    for (ChatMessageReadStatus status : unreadStatuses) {
	        status.markRead(); // 내부적으로 readYn=true, readAt=now
	        chatMessageReadStatusRepository.save(status);
	    }
	}

	/** 채팅방에서 현재 접속 중인 인원 id 리스트 반환 */
    @Override
    public List<Integer> getConnectedUserIdsInRoom(Integer roomId) {
        // WebSocketHandler의 userSessions 맵을 주입받거나 싱글톤/컨텍스트에서 가져와야 함
        // 예시: ChatWebSocketHandler.userSessions 맵을 static으로 선언해서 접근하거나,
        // 혹은 ChatWebSocketHandler에서 Service로 전달받는 구조로 구현해야 함.
        // 여기서는 직접 구현 예시 (실제 사용 시 핸들러와 연결 필요)
        // 실제 구현은 핸들러에서 userSessions 맵을 받아서 아래처럼 처리

        // 아래는 실제 핸들러에서 구현한 코드 참고용
        // return chatWebSocketHandler.getConnectedUserIdsInRoom(roomId);
    	log.info("roomId: {}", roomId);
    	
    	
    	List<Integer> connectedUserIds = new ArrayList<>();
        for (Map.Entry<Integer, WebSocketSession> entry : ChatWebSocketHandler.userSessions.entrySet()) {
            Integer userId = entry.getKey();
            WebSocketSession session = entry.getValue();
            if (session != null && session.isOpen()) {
                Object sessionRoomId = session.getAttributes().get("roomId");
                if (sessionRoomId != null && sessionRoomId.equals(roomId)) {
                    connectedUserIds.add(userId);
                }
            }
        }
    	
    	
        // 만약 의존성 주입/싱글톤으로 userSessions를 접근할 수 없다면, 아래는 스텁
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
}