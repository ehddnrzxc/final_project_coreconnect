package com.goodee.coreconnect.chat.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.chat.entity.Notification;
import com.goodee.coreconnect.chat.enums.NotificationType;
import com.goodee.coreconnect.chat.event.NotificationCreatedEvent;
import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.approval.repository.DocumentRepository;
import com.goodee.coreconnect.chat.dto.request.NotificationRequestDTO;
import com.goodee.coreconnect.chat.entity.Chat;
import com.goodee.coreconnect.chat.entity.ChatRoom;
import com.goodee.coreconnect.chat.entity.ChatRoomUser;
import com.goodee.coreconnect.chat.repository.NotificationRepository;
import com.goodee.coreconnect.chat.repository.ChatRepository;
import com.goodee.coreconnect.chat.repository.ChatRoomRepository;
import com.goodee.coreconnect.chat.repository.ChatRoomUserRepository;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

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

	// ApplicationEventPublisher 주입 (RequiredArgsConstructor로 자동 주입)
    private final ApplicationEventPublisher eventPublisher;
	
	// 채팅방의 참여자 user_id 리스트 조회
	@Transactional(readOnly = true)
	@Override
	public List<Integer> getParticipantIds(Integer roomId) {
		List<ChatRoomUser> users = chatRoomUserRepository.findByChatRoomId(roomId);
		return users.stream()
				.map(chatRoomUser -> chatRoomUser.getUser().getId())
				.collect(Collectors.toList());
	}

	// 채팅방의 참여자 email 리스트 조회
	@Override
	public List<String> getParticipantEmail(Integer roomId) {
		List<ChatRoomUser> users = chatRoomUserRepository.findByChatRoomIdWithUser(roomId);
		return users.stream()
				.map(chatRoomUser -> chatRoomUser.getUser().getEmail())
				.collect(Collectors.toList());
	}

	// 채팅방을 처음 생성 할때 주소록에서 채팅방에 초대할 사용자를 한명이상 선택
	@Transactional
	public ChatRoom createChatRoom(String name, List<Integer> userIds) {
	    String roomType = (userIds.size() == 1) ? "alone" : "group";
	    Boolean favoriteStatus = false;
		
	    // 정적 팩토리 메서드로 ChatRoom 객체 생성
	    ChatRoom chatRoom = ChatRoom.createChatRoom(name, roomType, favoriteStatus);

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

	// 채팅방 단일 조회
	@Override
	public ChatRoom findById(Integer id) {
		// JPA의 ChatRoomRepository를 통해 PK(id)로 채팅방을 조회
		return chatRoomRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("채팅방 없음: " + id));
	}

	// 채팅방 타입 변경
	@Transactional
	@Override
	public ChatRoom updateRoomType(int roomId, String roomType) {
		// 1. 기존 채팅방 조회 (없으면 예외)
		ChatRoom chatRoom = chatRoomRepository.findById(roomId)
				.orElseThrow(() -> new IllegalArgumentException("채팅방 없음: " + roomId));
		
		// 2. roomType 값 변경
		chatRoom.changeRoomType(roomType);
		
		// 3. DB에 저장 (JPA save는 변경 감지 시 자동 반영이므로 save 생략 가능하지만 명시적으로 호출해도 안전 )
		ChatRoom updatedRoom = chatRoomRepository.save(chatRoom);
		
		// 4. 변경된 객체 반환
		return updatedRoom;
	}

	// 채팅방에 채팅메시지 저장
	@Transactional
	@Override
	public List<Notification> saveNotification(Integer roomId, Integer senderId, String chatContent, NotificationType notificationType, Document document) {

	    ChatRoom chatRoom = null;
	    if (roomId != null) {
	        chatRoom = chatRoomRepository.findById(roomId)
	                .orElseThrow(() -> new IllegalArgumentException("채팅방 없음: " + roomId));
	    }

	    User sender = userRepository.findById(senderId)
	            .orElseThrow(() -> new IllegalArgumentException("사용자 없음: " + senderId));

	    List<Notification> notifications = new ArrayList<>();

	    // 1) CHAT 타입: 채팅 메시지 저장 + 채팅방 참여자 모두에게 Notification 생성
	    if (notificationType == NotificationType.CHAT && chatRoom != null) {
	        // 채팅 메시지 저장
	        Chat chat = Chat.createChat(chatRoom, sender, chatContent, false, chatContent, LocalDateTime.now());
	        chat = chatRepository.save(chat);

	        // 채팅방 참여자에게 알림 생성 (참여자 전원 또는 발신자 제외)
	        List<ChatRoomUser> participants = chatRoomUserRepository.findByChatRoomId(roomId);
	        for (ChatRoomUser participant : participants) {
	            User recipient = participant.getUser();
	            if (recipient == null) continue;
	            // (옵션) 발신자에게는 알림 생성하지 않음
	            if (recipient.getId().equals(sender.getId())) continue;

	            String message = sender.getName() + "님으로부터 새로운 채팅 메시지가 도착했습니다: " + chatContent;
	            Notification notification = Notification.createNotification(
	                    recipient,                     // 수신자
	                    NotificationType.CHAT,
	                    message,
	                    chat,                          // chat 연결
	                    null,                          // document 없음
	                    false,                         // readYn
	                    false,                         // sentYn (아직 전송 상태 아님)
	                    false,                         // deletedYn
	                    LocalDateTime.now(),
	                    null
	            );
	            notificationRepository.save(notification);
	            notifications.add(notification);
	        }

	    } else {
	        // 2) 단일 알림 타입(EMAIL, NOTICE, APPROVAL, SCHEDULE 등)
	        // 수신자 결정 전략:
	        //  - roomId가 주어지면 해당 채팅방 참여자들을 수신자로 사용 (발신자는 제외)
	        //  - roomId가 없으면 기본적으로 발신자 자신에게 알림을 생성 (정책 변경 가능)
	        List<User> recipients = new ArrayList<>();
	        if (chatRoom != null) {
	            List<ChatRoomUser> participants = chatRoomUserRepository.findByChatRoomId(roomId);
	            for (ChatRoomUser cru : participants) {
	                User u = cru.getUser();
	                if (u == null) continue;
	                // 발신자 제외
	                if (u.getId().equals(sender.getId())) continue;
	                recipients.add(u);
	            }
	        } else {
	            // 수신자 정보가 없는 경우: 기본적으로 발신자 본인에게 알림 생성
	            recipients.add(sender);
	        }

	        // 타입별 기본 메시지 생성
	        String defaultMsg;
	        switch (notificationType) {
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

	        for (User recipient : recipients) {
	            String messageToUse = defaultMsg;
	            // 추가적인 커스터마이징: 예를 들어 chatContent가 있고 타입이 EMAIL이면 content 포함 등
	            if (notificationType == NotificationType.EMAIL && chatContent != null && !chatContent.isBlank()) {
	                messageToUse = chatContent; // 또는 sender + "님의 메일: " + chatContent 등
	            }

	            Notification notification;
	            if ((notificationType == NotificationType.APPROVAL || notificationType == NotificationType.SCHEDULE) && document != null) {
	                // 문서 연계 알림 (document 연결)
	                notification = Notification.createNotification(
	                        recipient,
	                        notificationType,
	                        messageToUse,
	                        null,       // chat 없음
	                        document,   // document 연결
	                        false,
	                        false,
	                        false,
	                        LocalDateTime.now(),
	                        null
	                );
	            } else {
	                // 그 외 알림
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
	    }

	    // 이벤트 발행: NotificationCreatedEvent를 통해 WebSocket 푸시 리스너가 동작하도록 함.
	    try {
	        // NotificationCreatedEvent은 (source, notifications) 생성자 형태여야 함
	        eventPublisher.publishEvent(new NotificationCreatedEvent(this, notifications));
	    } catch (Exception e) {
	        // 푸시 실패로 트랜잭션 롤백시키지 않도록 예외는 흡수(로그만 남김)
	        log.warn("NotificationCreatedEvent publish failed: {}", e.getMessage(), e);
	    }

	    return notifications;
	}

	@Override
	public void sendNotification(NotificationRequestDTO dto) {
		// TODO Auto-generated method stub
		
	}

	/**
	 * 전자결재 문서 삭제시 알림 삭제
	 * */
	@Override
	public void deleteDocumentAndNotification(Integer documentId) {
		// 1. 문서 삭제 상태 변경
		Document document = documentRepository.findById(documentId)
				.orElseThrow(() -> new IllegalArgumentException("문서 없음: " + documentId));
		document.markDeleted(true);
		documentRepository.save(document);
		
		// 2. 관련 알림 soft-delete (notification_deleted_yn 필드가 있다고 가정)
		List<Notification> notifications = notificationRepository.findByDocumentId(documentId);
		for (Notification notification : notifications) {
		    notification.markDeleted(); 
		    notificationRepository.save(notification);
		}
	}

}
