package com.goodee.coreconnect.common.notification.handler;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.goodee.coreconnect.common.notification.enums.NotificationType;
import com.goodee.coreconnect.common.notification.service.NotificationService;
import com.goodee.coreconnect.common.notification.service.WebSocketDeliveryService;
import com.goodee.coreconnect.security.jwt.JwtProvider;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationWebSocketHandler extends TextWebSocketHandler {
	
	private final NotificationService notificationService;
	private final JwtProvider jwtProvider;
	private final UserRepository userRepository;
	private final WebSocketDeliveryService webSocketDeliveryService;
	
	private final ObjectMapper objectMapper = new ObjectMapper();
	private final Map<Integer, WebSocketSession> userSessions = new ConcurrentHashMap<>();
	
	/**
	 * 클라이언트(WebSocket) 연결 시 호출
	 * */
	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
		// JWT에서 사용자 ID 추출
		Integer userId = getUserIdFromSession(session);
		
		// 사용자 ID가 있다면
		if (userId != null) {
			// 세션을 map에 등록
			userSessions.put(userId, session);
			// 공통 서비스에 등록
			webSocketDeliveryService.registerSession(userId, session);
		}
	}

	/**
	 * 클라이언트(WebSocket) 해제 시 호출 
	 * */
	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
		// JWT에서 사용자 ID 추출
		Integer userId = getUserIdFromSession(session);
		if (userId != null) {
			// 세션 맵에서 제거
			userSessions.remove(userId);
			webSocketDeliveryService.unregisterSession(userId);
		}
	}
	
	/**
	 * 텍스트 메시지 수신 시 실행되는 콜백
	 * */
	@Override
	protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
		// 메시지(JSON) 파싱
		JsonNode node = objectMapper.readTree(message.getPayload());
		// 송신자 ID 추출
		Integer senderId = getUserIdFromSession(session);
		
		// 수신자, 알림 타입, 메시지 내용 추출
		Integer recipientId = node.has("recipientId") ? node.get("recipientId").asInt() : null; // 수신자 Id
		// 알림 메시지
		String msg = node.has("message") ? node.get("message").asText() : null;
		// 알림 타입 문자열 
		String typeStr = node.has("type") ? node.get("type").asText() : "EMAIL"; // 기본값은 EMAIL로!
		NotificationType type;
		try {
		    type = NotificationType.valueOf(typeStr.toUpperCase());
		} catch(Exception e) {
		    type = NotificationType.EMAIL; // 파싱 실패 시 EMAIL로!
		}
		
		// 송신자 이름 조회
		String senderName = null;
		if (senderId != null) {
			// 송신자 엔티티 조회
			User user = userRepository.findById(senderId).orElse(null);
			senderName = senderName != null ? user.getName() : null;
		}
		
		// 알림 저장 및 실시간 푸시
		notificationService.sendNotification(recipientId, type, msg, null, null, senderId, senderName);
		
	}
	
	/**
	 * WebSocketSession에서 JWT 토큰을 파싱하여 사용자 ID 추출
	 * 
	 * */
	private Integer getUserIdFromSession(WebSocketSession session) {
		
		// 1. Authorization 헤더에서 Bearer 토큰 추출
		List<String> authHeaders = session.getHandshakeHeaders().get("Authorization");
		String token = null;
		if (authHeaders != null && !authHeaders.isEmpty()) {
			// 첫번째 헤더 값
			String bearer = authHeaders.get(0);
			if (bearer.startsWith("Bearer ")) {
				// "Bearer " 부분 제거
				token = bearer.substring(7);
			}
		}
		
		// 2. 쿼리 파라미터 accessToke=xxx 지원
		if (token == null) {
			String query = session.getUri().getQuery();
			if (query != null && query.startsWith("accessToken=")) {
				token = query.substring("accessToken=".length());
			}
		}
		
		// 토큰 없으면 null
		if (token == null) {
			return null;
		}
		
		try {
			
			// 토큰에서 이메일 추출
			String email = jwtProvider.getSubject(token);
			// 이메일로 사용자 조회
			User user = userRepository.findByEmail(email).orElse(null);
			// 사용자 ID 반환
			return user != null ? user.getId() : null;
			
		} catch (Exception e) {
			return null;
		}
		
	}
	
	
}
