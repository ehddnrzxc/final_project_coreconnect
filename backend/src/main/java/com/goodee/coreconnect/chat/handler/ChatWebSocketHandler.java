package com.goodee.coreconnect.chat.handler;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.approval.repository.DocumentRepository;
import com.goodee.coreconnect.chat.dto.response.ChatResponseDTO;
import com.goodee.coreconnect.chat.entity.Chat;
import com.goodee.coreconnect.chat.entity.Notification;
import com.goodee.coreconnect.chat.enums.NotificationType;
import com.goodee.coreconnect.chat.repository.NotificationRepository;
import com.goodee.coreconnect.chat.service.ChatRoomService;
import com.goodee.coreconnect.security.jwt.JwtProvider;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 1:1, 1:N 채팅을 위한 WebSocketHandler
 * 
 * 
 * */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {
	
	// 사용자ID와 세션 매핑 (추후 Redis로 확장 가능)
	public final Map<Integer, WebSocketSession> userSessions = new ConcurrentHashMap<>();
	
	private final JwtProvider jwtProvider;
	
	private final UserRepository userRepository;
		
	private final ChatRoomService chatRoomService;
	
	private final NotificationRepository alarmRepository;
	
	private final DocumentRepository documentRepository;
	
	// JSON 파싱용 ObjectMapper
	private final ObjectMapper objectMapper = new ObjectMapper();
	
	// 사용자별 구독 중인 채팅방 목록을 관리 (userId -> List of roomIds)
	private final Map<Integer, List<Integer>> userSubscriptions = new ConcurrentHashMap<>();
	
	public Map<Integer, WebSocketSession> getUserSessions() {
		return userSessions;
	}
	
	/**
	 * 서버(예: REST 컨트롤러)에서 DB에 Chat을 저장한 후에, 연결된 WebSocket 클라이언트들에게
	 * 실시간으로 메시지를 푸시하려면 이 메서드를 호출하세요.
	 *
	 * @param chat         저장된 Chat 엔티티 (JPA에서 반환된 상태)
	 * @param recipientIds 푸시할 대상 사용자 ID 리스트 (sender 제외 등 필터는 호출자가 처리)
	 */
	public void pushChatToRecipients(Chat chat, List<Integer> recipientIds) {
		if (chat == null || recipientIds == null || recipientIds.isEmpty()) {
			return;
		}

		ChatResponseDTO dto = ChatResponseDTO.builder()
				.id(chat.getId())
				.messageContent(chat.getMessageContent())
				.sendAt(chat.getSendAt())
				.fileYn(chat.getFileYn())
				.fileUrl(chat.getFileUrl())
				.roomId(chat.getChatRoom() != null ? chat.getChatRoom().getId() : null)
				.senderId(chat.getSender() != null ? chat.getSender().getId() : null)
				.senderName(chat.getSender() != null ? chat.getSender().getName() : null)
				.notificationType(NotificationType.CHAT.name())
				.build();

		String payload;
		try {
			payload = objectMapper.writeValueAsString(dto);
		} catch (Exception e) {
			log.error("Failed to serialize ChatResponseDTO for chatId={}: {}", chat.getId(), e.getMessage(), e);
			return;
		}

		TextMessage textMessage = new TextMessage(payload);

		for (Integer userId : recipientIds) {
			try {
				WebSocketSession sess = userSessions.get(userId);
				if (sess != null && sess.isOpen()) {
					sess.sendMessage(textMessage);
					log.debug("Pushed chatId={} to userId={}", chat.getId(), userId);
				} else {
					log.debug("No open WS session for userId={} (chatId={})", userId, chat.getId());
				}
			} catch (IOException ioe) {
				log.warn("Failed to push chatId={} to userId={}: {}", chat.getId(), userId, ioe.getMessage());
			} catch (Exception ex) {
				log.error("Unexpected error while pushing chatId={} to userId={}: {}", chat.getId(), userId, ex.getMessage(), ex);
			}
		}
	}
	
	
	// 클라이언트 연결 시 사용자 세션 저장
	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
		Integer userId = getUserIdFromSession(session); // JWT/Principal에서 추출
		if (userId != null) {
			userSessions.put(userId, session);
		}		
	}
	
	
	// 클라이언트 연결 해제 시 세션 제거
	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
		Integer userId = getUserIdFromSession(session);
		if (userId != null) {
			userSessions.remove(userId);
		}
	}	
	
	
	// JWT, Principal 에서 userId 추출하는 로직
	private Integer getUserIdFromSession(WebSocketSession session) {
		// 1. JWT 토큰 추출 (클라이언트가 "Authorization: Bearer xxx"로 보내야 함)
		String token = null;
		
		// 표준 헤더
		List<String> authHeaders = session.getHandshakeHeaders().get("Authorization");
		if (authHeaders != null && !authHeaders.isEmpty()) {
			String bearer = authHeaders.get(0);
			if (bearer.startsWith("Bearer ")) {
				token = bearer.substring(7);
			}
		}

		if (token == null) {
			String query = session.getUri().getQuery(); // "accessToken=xxx"
			if (query != null && query.startsWith("accessToken=")) {
				token = query.substring("accessToken=".length());
			}
		}
		
		if (token == null) return null;
		
		try {
			// 2. JwtProvider에서 subject(email) 추출
			String email = jwtProvider.getSubject(token);
			// 3. email로 userId 조회
			User user = userRepository.findByEmail(email).orElse(null);
			return user != null ? user.getId().intValue() : null;
		} catch (Exception e) {
			return null;
		}
	}
	
	@Override
	protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
	    String payload = message.getPayload();

	    JsonNode node;
	    try {
	        node = objectMapper.readTree(payload);
	    } catch (Exception e) {
	        log.error("[handleTextMessage] JSON 파싱 오류: " + e.getMessage());
	        e.printStackTrace();
	        return;
	    }

	    String typeStr = node.has("type") ? node.get("type").asText() : "CHAT";
	    NotificationType notificationType;
	    try {
	        notificationType = NotificationType.valueOf(typeStr.toUpperCase());
	    } catch (Exception e) {
	        log.warn("알림 타입 파싱 오류: {}", typeStr);
	        notificationType = NotificationType.CHAT;
	    }

	    Long roomId = extractRoomId(payload);
	    Integer senderId = getUserIdFromSession(session);
	    String chatContent = extractChatContent(payload);
	    Integer userId = senderId; // 실제로는 senderId와 userId가 동일하게 추출됨

	    // 채팅방 참여자 리스트 (CHAT일 때만)
	    List<Integer> participantIds = (notificationType == NotificationType.CHAT && roomId != null)
	        ? chatRoomService.getParticipantIds(roomId.intValue())
	        : new ArrayList<>();
	    
	    Document document = null;
	    if (notificationType == NotificationType.APPROVAL || notificationType == NotificationType.SCHEDULE) {
	        // docId가 payload에 포함되어 있다고 가정
	        Integer docId = node.has("docId") ? node.get("docId").asInt() : null;
	        if (docId != null) {
	            document = documentRepository.findById(docId)
	                .orElseThrow(() -> new IllegalArgumentException("문서 없음: " + docId));
	        }
	    }
	    

	    // 알림 저장
	    List<Notification> notifications = chatRoomService.saveNotification(
	        roomId != null ? roomId.intValue() : null,
	        senderId,
	        chatContent,
	        notificationType,
	        document
	    );

	    if (notificationType == NotificationType.CHAT) {
	        // CHAT: 채팅방 참여자에게 메시지 push
	        for (Integer user : participantIds) {
	            WebSocketSession userSession = userSessions.get(user);
	            log.info("user {} session: {}", user, userSession);
	            if (userSession != null && userSession.isOpen() && chatContent != null && !chatContent.isEmpty()) {
	                userSession.sendMessage(new TextMessage(chatContent));
	                log.info("메시지 전송: user_id={}, content={}", user, chatContent);
	            }
	        }
	    } else {
	        // SCHEDULE/NOTICE/APPROVAL/EMAIL: 알림 수신자(userId)에게만 알림 push
	        for (Notification notification : notifications) {
	            Integer receiverId = notification.getUser().getId();
	            String messageText = notification.getNotificationMessage();
	            WebSocketSession userSession = userSessions.get(receiverId);
	            log.info("알림 전송: type={}, user_id={}, session={}", notificationType, receiverId, userSession);
	            if (userSession != null && userSession.isOpen() && messageText != null && !messageText.isEmpty()) {
	                userSession.sendMessage(new TextMessage(messageText));
	                log.info("알림 메시지 전송: user_id={}, message={}", receiverId, messageText);
	            }
	        }
	    }

	    // 필요시 DB 상태 업데이트 등(알림 전송 상태, 시각)
	    for (Notification notification : notifications) {
	        Integer receiverId = notification.getUser().getId();
	        NotificationType alarmType = notification.getNotificationType();
	        String messageText = notification.getNotificationMessage();
	        Integer alarmId = notification.getId();
	        sendAlarmToUser(receiverId, alarmType.name(), messageText, alarmId);
	    }
	}
	
	
	// 메시지 payload(JSON)에서 채팅방ID(roomId) 값을 추출
	private Long extractRoomId(String payload) {
		
		try {
			JsonNode node = objectMapper.readTree(payload);
			if (node.has("roomId")) {
				return node.get("roomId").asLong();
			}
		} catch (Exception e) {
			log.error("[extractRoomId] JSON 파싱 오류: " + e.getMessage());
			e.printStackTrace();
		}
		
		return null;		
	}
	
	
	// 메시지 payload(JSON)에서 실제 메시지 내용(content)을 추출
	private String extractChatContent(String payload) {
		try {
			JsonNode node = objectMapper.readTree(payload);
			if (node.has("content")) {
				return node.get("content").asText();
			}
		} catch (Exception e) {
			log.error("[extractChatContent] content 필드가 없습니다. payload: " + payload);
			e.printStackTrace();
		}
		return "";
	}
	
	
	// 알림을 받아야 하는 사용자가 여러명 일때 
	public void sendAlarmToUsers(List<Integer> userIds, String alarmType, String message, List<Integer> alarmIds) {
		
		for (int i = 0; i < userIds.size(); i++) {
			Integer userId = userIds.get(i);
			Integer alarmId = (alarmIds != null && alarmIds.size() > i) ? alarmIds.get(i) : null;
			sendAlarmToUser(userId, alarmType, message, alarmId);
		}
	}
		
	
	// 알림이 채팅, 이메일, 전자결제, 일정, 공지에서 발생한 경우 사용자에게 알림을 보낼수 있도록 하는 메서드
	public void sendAlarmToUser(Integer userId, String alarmType, String message, Integer alarmId ) {
		WebSocketSession session = userSessions.get(userId);
		String title = "";
		boolean sentSuccess = false;
		if (session != null && session.isOpen()) {
			ObjectNode json = objectMapper.createObjectNode();
			json.put("type", "alarm");
			json.put("alarmType", alarmType); // mail, message, calendar, board, schedule, approval
			json.put("recipientId", userId); // 알람 수신자
			json.put("title", title); // "전자결개 승인 요청이 있습니다", "새로운 일정이 등록되었습니다", "채팅 메시지가 도착했습니다", "이메일이 도착했습니다", "공지가 등록되었습니다."
			json.put("message", message);  //  
			json.put("alarmId", alarmId);
			try {
				
			} catch (Exception e) {
				log.error("[sendAlarmToUser] 알림 전송 오류: " + e.getMessage());
				sentSuccess = false;
			}
		}
		  updateAlarmSentYn(alarmId, sentSuccess);		
	}
	
	
	// 알림 전송 성공/실패 상태 DB에 저장
	public void updateAlarmSentYn(Integer alarmId, boolean sentSuccess) {
		if (alarmId == null) return;
		try {
			Optional<Notification> notificationOpt = alarmRepository.findById(alarmId);
			if (notificationOpt.isPresent()) {
				 Notification notification = notificationOpt.get();
				 notification.markSent(LocalDateTime.now()); // setter 대신 메서드로 변경
		            alarmRepository.save(notification);
			}
			
		} catch (Exception e) {
			log.error("[updatedAlarmSentYn] 알림 전송 상태 저장 오류: " + e.getMessage());
		}
	}
	
	
}
