package com.goodee.coreconnect.chat.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.chat.event.NotificationCreatedEvent;
import com.goodee.coreconnect.common.dto.request.NotificationRequestDTO;
import com.goodee.coreconnect.common.entity.Notification;
import com.goodee.coreconnect.common.notification.dto.NotificationPayload; // DTO import 추가
import com.goodee.coreconnect.common.notification.enums.NotificationType;
import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.approval.repository.DocumentRepository;
import com.goodee.coreconnect.chat.entity.Chat;
import com.goodee.coreconnect.chat.entity.ChatRoom;
import com.goodee.coreconnect.chat.entity.ChatRoomUser;
import com.goodee.coreconnect.chat.entity.MessageFile;
import com.goodee.coreconnect.chat.repository.NotificationRepository;
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
	                     null
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
	                     null
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
	public List<Integer> getChatRoomIdsByUserId(Integer userId) {
		List<ChatRoomUser> chatRoomUsers = chatRoomUserRepository.findByUserId(userId);
		return chatRoomUsers.stream()
				.map(cru -> cru.getChatRoom().getId())
				.distinct()
				.collect(Collectors.toList());
	}

	@Transactional
	@Override
	public Chat sendChatMessage(Integer roomId, Integer senderId, Object contentOrFile) {
		
		ChatRoom chatRoom = chatRoomRepository.findById(roomId).orElseThrow(() -> new IllegalArgumentException("채팅방 없음: " + roomId));
		User sender = userRepository.findById(senderId)
	            .orElseThrow(() -> new IllegalArgumentException("사용자 없음: " + senderId));
		
		Chat chat;
		if (contentOrFile instanceof String) {
		    // 텍스트 메시지
		    chat = Chat.createChat(chatRoom, sender, (String) contentOrFile, false, null, LocalDateTime.now());
		} else if (contentOrFile instanceof MessageFile) {
			// 파일 메시지
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
		return chat;
	}
	
	
}