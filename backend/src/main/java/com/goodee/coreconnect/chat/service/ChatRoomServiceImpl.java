package com.goodee.coreconnect.chat.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.chat.entity.Notification;
import com.goodee.coreconnect.chat.enums.NotificationType;
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

@Service
@RequiredArgsConstructor
public class ChatRoomServiceImpl implements ChatRoomService {

	private final ChatRoomUserRepository chatRoomUserRepository;
	private final ChatRoomRepository chatRoomRepository;
	private final ChatRepository chatRepository;
	private final NotificationRepository notificationRepository;
	private final UserRepository userRepository;

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
		ChatRoom chatRoom = new ChatRoom();
		chatRoom.setRoomName(name);
		
		// 참여자 수에 따라 roomType 설정
		if (userIds.size() == 1) {
			chatRoom.setRoomType("alone"); // 참여자가 1명이라면 "alone"
		} else {
			chatRoom.setRoomType("group"); // 2명 이상이면 "group"
		}
		
		chatRoomRepository.save(chatRoom);
		
		for (Integer userID : userIds) {
			User user = userRepository.findById(userID).orElseThrow();
			ChatRoomUser chatRoomUser = new ChatRoomUser();
			chatRoomUser.setChatRoom(chatRoom);
			chatRoomUser.setUser(user);
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
		chatRoom.setRoomType(roomType);
		
		// 3. DB에 저장 (JPA save는 변경 감지 시 자동 반영이므로 save 생략 가능하지만 명시적으로 호출해도 안전 )
		ChatRoom updatedRoom = chatRoomRepository.save(chatRoom);
		
		// 4. 변경된 객체 반환
		return updatedRoom;
	}

	// 알림 생성 및 알림 타입별 메시지 생성
	@Transactional
	@Override
	public List<Notification> saveNotification(Integer roomId, Integer senderId, String chatContent, NotificationType notificationType) {
		
		ChatRoom chatRoom = null;
		if (roomId != null) {
			chatRoom = chatRoomRepository.findById(roomId)
					.orElseThrow(() -> new IllegalArgumentException("채팅방 없음: " + roomId));
		}
		
		User sender = userRepository.findById(senderId)
				.orElseThrow(() -> new IllegalArgumentException("사용자 없음: " + senderId));
		
		List<ChatRoomUser> participants = (roomId != null)
				? chatRoomUserRepository.findByChatRoomId(roomId)
			    : new ArrayList<>();
		
		List<Notification> notifications = new ArrayList<>();
		
		// 채팅 메시지 저장 (CHAT 타입일 때만)
		Chat chat = null;
		if (notificationType == NotificationType.CHAT && chatRoom != null) {
			chat = new Chat();
			chat.setChatRoom(chatRoom);
			chat.setMessageContent(chatContent);
			chat.setSendAt(LocalDateTime.now());
			chat.setFileYn(false);
			chat.setSender(sender);
			chat = chatRepository.save(chat);
		}

		// 참여주 수에 따라 groupType 결정
		String groupType = (participants.size() == 1) ? "alone" : "group";
		
		// Notification 생성 및 타입멸 메시지 생성
		for (ChatRoomUser participant : participants) {
			Notification notification = new Notification();
			notification.setChat(chat); // CHAT 타입일 떄만 chat 연결, 아니면 null
			notification.setNotificationType(notificationType.name().toLowerCase());
			notification.setNotificationSentYn(false);
			notification.setNotificationReadYn(false);
			notification.setNotificationSentAt(LocalDateTime.now());
			notification.setNotificationReadAt(null);
			notification.setUser(participant.getUser());
			
			// 타입별 알림 메시지 생성
			String message;
			switch (notificationType) {
				
				case CHAT:
					message = sender.getName() + "님으로부터 새로운 채팅 메시지가 도착했습니다.";
					break;
				case EMAIL:
					message = sender.getName() + "님으로부터 이메일이 도착했습니다.";
					break;
				case NOTICE:
					message = sender.getName() + "님이 공지를 등록했습니다.";
					break;
				case APPROVAL:
                    message = sender.getName() + "님이 결재 요청을 보냈습니다.";
                    break;
                case SCHEDULE:
                    message = sender.getName() + "님이 일정을 등록했습니다.";
                    break;
                default:
                    message = sender.getName() + "님으로부터 새로운 알림이 있습니다.";
                    break;	
			}
			notification.setNotificationMessage(message);
			
			notificationRepository.save(notification);
			notifications.add(notification);
		}
		
		return notifications;
	}

	@Override
	public void sendNotification(NotificationRequestDTO dto) {
		// TODO Auto-generated method stub
		
	}

	
	
	
}
