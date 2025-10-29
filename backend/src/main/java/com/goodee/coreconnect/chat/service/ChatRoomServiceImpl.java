package com.goodee.coreconnect.chat.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.chat.entity.Notification;
import com.goodee.coreconnect.chat.enums.NotificationType;
import com.goodee.coreconnect.chat.event.NotificationCreatedEvent;
import com.goodee.coreconnect.common.notification.dto.NotificationPayload; // DTO import 추가
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
	public List<Notification> saveNotification(Integer roomId, Integer senderId, String chatContent, NotificationType notificationType, Document document) {
		log.info("CHAT: chatContent2: {}", chatContent);
	    ChatRoom chatRoom = null;
	    if (roomId != null) {
	        chatRoom = chatRoomRepository.findById(roomId)
	                .orElseThrow(() -> new IllegalArgumentException("채팅방 없음: " + roomId));
	    }

	    User sender = userRepository.findById(senderId)
	            .orElseThrow(() -> new IllegalArgumentException("사용자 없음: " + senderId));

	    List<Notification> notifications = new ArrayList<>();

	    if (notificationType == NotificationType.CHAT && chatRoom != null) {
	        Chat chat = Chat.createChat(chatRoom, sender, chatContent, false, chatContent, LocalDateTime.now());
	        log.info("CHAT: content: {}", chatContent);
	        chat = chatRepository.save(chat);

	        List<ChatRoomUser> participants = chatRoomUserRepository.findByChatRoomId(roomId);
	        for (ChatRoomUser participant : participants) {
	            User recipient = participant.getUser();
	            if (recipient == null) continue;
	            if (recipient.getId().equals(sender.getId())) continue;

	            String message = sender.getName() + "님으로부터 새로운 채팅 메시지가 도착했습니다: " + chatContent;
	            Notification notification = Notification.createNotification(
	                    recipient,
	                    NotificationType.CHAT,
	                    message,
	                    chat,
	                    null,
	                    false,
	                    false,
	                    false,
	                    LocalDateTime.now(),
	                    null
	            );
	            notificationRepository.save(notification);
	            notifications.add(notification);
	        }

	    } else {
	        List<User> recipients = new ArrayList<>();
	        if (chatRoom != null) {
	            List<ChatRoomUser> participants = chatRoomUserRepository.findByChatRoomId(roomId);
	            for (ChatRoomUser cru : participants) {
	                User u = cru.getUser();
	                if (u == null) continue;
	                if (u.getId().equals(sender.getId())) continue;
	                recipients.add(u);
	            }
	        } else {
	            recipients.add(sender);
	        }

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
	            if (notificationType == NotificationType.EMAIL && chatContent != null && !chatContent.isBlank()) {
	                messageToUse = chatContent;
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
	    }

	    // [수정] Notification 엔티티 → NotificationPayload DTO 리스트로 변환
	    try {
	        List<NotificationPayload> payloads = notifications.stream().map(n -> {
	            NotificationPayload p = new NotificationPayload();
	            p.setNotificationId(n.getId());
	            p.setRecipientId(n.getUser() != null ? n.getUser().getId() : null);
	            p.setChatId(n.getChat() != null ? n.getChat().getId() : null);
	            p.setRoomId((n.getChat() != null && n.getChat().getChatRoom() != null) ? n.getChat().getChatRoom().getId() : null);
	            p.setSenderId((n.getChat() != null && n.getChat().getSender() != null) ? n.getChat().getSender().getId() : null);
	            p.setSenderName((n.getChat() != null && n.getChat().getSender() != null) ? n.getChat().getSender().getName() : null);
	            p.setMessage(n.getNotificationMessage());
	            p.setNotificationType(n.getNotificationType() != null ? n.getNotificationType().name() : null);
	            p.setCreatedAt(n.getNotificationSentAt() != null ? n.getNotificationSentAt() : LocalDateTime.now());
	            return p;
	        }).collect(Collectors.toList());

	        eventPublisher.publishEvent(new NotificationCreatedEvent(this, payloads));
	    } catch (Exception e) {
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
	
	
}