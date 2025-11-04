package com.goodee.coreconnect.chat.handler;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.goodee.coreconnect.chat.dto.response.ChatResponseDTO;
import com.goodee.coreconnect.chat.entity.Chat;
import com.goodee.coreconnect.chat.entity.ChatMessageReadStatus;
import com.goodee.coreconnect.chat.repository.ChatMessageReadStatusRepository;
import com.goodee.coreconnect.chat.service.ChatRoomService;
import com.goodee.coreconnect.common.notification.service.WebSocketDeliveryService;
import com.goodee.coreconnect.security.jwt.JwtProvider;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.Objects;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler{	
	// 사용자 ID별 WebSocketSession 관리용 맵
	public static final Map<Integer, WebSocketSession> userSessions = new ConcurrentHashMap<>();
	
	// 채팅방 관련 서비스
    private final ChatRoomService chatRoomService;
    // JWT 토큰 파싱을 위한 프로바이더
    private final JwtProvider jwtProvider;
    // 사용자 정보 조회용 레포지토리
    private final UserRepository userRepository;
    
    private final ChatMessageReadStatusRepository chatMessageReadStatusRepository;
    
    // 실시간 메시지 전송을 위한 공통 서비스
    private final WebSocketDeliveryService webSocketDeliveryService;

    // JSON 파싱을 위한 ObjectMapper (JavaTimeModule 등록)
    private final ObjectMapper objectMapper = new ObjectMapper()
    		.registerModule(new JavaTimeModule())
    		.disable(SerializationFeature.WRITE_DATE_TIMESTAMPS_AS_NANOSECONDS);// ISO8601 포맷으로 직렬화
    
    //private final Map<Integer, WebSocketSession> userSessions = new ConcurrentHashMap<>();
	
    // 클라잉너트 websocket 연결 시 호출
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
    	// JWT에서 사용자 ID 추출
    	Integer userId = getUserIdFromSession(session);
    	Integer roomId = getRoomIdFromSession(session);
    	
    	log.info("afterConnectionEstablished - userId: {}", userId);
        log.info("afterConnectionEstablished - roomId: {}", roomId);
        
        // 반드시 session attributes에 roomId 넣기! (이걸 빼먹으면 연결 추적 불가능)
        if (roomId != null) {
            session.getAttributes().put("roomId", roomId);
            log.info("session.getAttributes().put(roomId): {}", roomId);
        } else {
            log.warn("WebSocket 연결에 roomId 없음 - 클라이언트 URI query를 확인하세요.");
        }

        // 세션 맵에 등록 - userSessions에 (userId, session)
        if (userId != null) {
            userSessions.put(userId, session);
            webSocketDeliveryService.registerSession(userId, session);

            log.info("userSessions.put 완료 - userId: {}, roomId: {}", userId, roomId);

            // 방 입장시 안읽은 메시지 읽음 처리
            if (roomId != null) {
                chatRoomService.markMessagesAsRead(roomId, userId);
            }
        } else {
            log.warn("WebSocket 연결에 userId 없음 - JWT token/Authorization 문제 체크!");
        }
    }
    
    // 클라이언트(WebSocket) 연결 해제 시 호출
	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
		// 사용자 ID 추출
		Integer userId = getUserIdFromSession(session);
		if (userId != null) {
			// 세션을 맵에 등록
			userSessions.put(userId, session);
			webSocketDeliveryService.registerSession(userId, session);
		}
	}
	
	// 텍스트 메시지 수신 시 실행되는 콜백
	@Override
	protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
	    JsonNode node = objectMapper.readTree(message.getPayload());
	    Integer senderId = getUserIdFromSession(session);

	    Integer roomId = node.has("roomId") ? node.get("roomId").asInt() : null;
	    String chatContent = node.has("content") ? node.get("content").asText() : null;
	    if (roomId == null || chatContent == null) return;

	    // 전체 참가자
	    List<Integer> participantIds = chatRoomService.getParticipantIds(roomId);
	    log.info("senderId: {}", senderId);
	    log.info("participantIds: {}", participantIds);

	    // 본인 제외 - Objects.equals로 안전 비교
	    List<Integer> otherParticipantIds = participantIds.stream()
	        .filter(pid -> senderId != null && !Objects.equals(pid, senderId))
	        .collect(Collectors.toList());
	    log.info("otherParticipantIds: {}", otherParticipantIds);

	    // 접속중인 인원 리스트 - 본인 제외
	    List<Integer> connectedUserIds = getConnectedUserIdsInRoom(roomId);
	    log.info("connectedUserIds: {}", connectedUserIds);

	    List<Integer> otherConnectedUserIds = connectedUserIds.stream()
	        .filter(pid -> senderId != null && !Objects.equals(pid, senderId))
	        .collect(Collectors.toList());
	    log.info("otherConnectedUserIds: {}", otherConnectedUserIds);

	    // unreadCount 계산
	    int unreadCount = otherParticipantIds.size() - otherConnectedUserIds.size();
	    if (unreadCount < 0) unreadCount = 0;

	    log.info("unreadCount: {}", unreadCount);

	    ChatResponseDTO dto = chatRoomService.saveChatAndReturnDTO(roomId, senderId, chatContent, unreadCount);

	    String payload = objectMapper.writeValueAsString(dto);

	    // 전체 참가자에게 메시지 push
	    for (Integer pid : participantIds) {
	        WebSocketSession s = userSessions.get(pid);
	        if (s != null && s.isOpen()) {
	            s.sendMessage(new TextMessage(payload));
	        }
	    }

	    for (Integer offlineUserId : participantIds) {
	        String alerMsg = dto.getSenderName() + "님으로부터 새로운 채팅 메시지가 도착했습니다";
	        webSocketDeliveryService.sendToUser(offlineUserId, alerMsg);

	        String toastMsg = chatRoomService.getUnreadToadMsgForUser(offlineUserId);
	        if (toastMsg != null) {
	            webSocketDeliveryService.sendToUser(offlineUserId, toastMsg);
	        }
	    }
	}
	
	
	/**
	 * WebSocketSession에서 JWT 토큰을 파싱하여 사용자 ID 추출
	 * */
	private Integer getUserIdFromSession(WebSocketSession session) {
		
		// 헤더에서 Authorization 추출
		List<String> authHeaders = session.getHandshakeHeaders().get("Authorization");
		String token = null;
		if (authHeaders != null && !authHeaders.isEmpty()) {
			String bearer = authHeaders.get(0);
			if (bearer.startsWith("Bearer ")) {
				token = bearer.substring(7); // Bearer 제거
				log.info("getUserIdFromSession() - token: {}", token);
			}
		}
		
		// 2. 쿼리 파라미터에서 robust하게 accessToken 추출
	    if (token == null) {
	        String query = session.getUri().getQuery();
	        if (query != null) {
	            String[] params = query.split("&");
	            for (String param : params) {
	                String[] kv = param.split("=");
	                if (kv.length == 2 && kv[0].equals("accessToken")) {
	                    token = kv[1];
	                    log.info("getUserIdFromSession() - token by query: {}", token);
	                    break;
	                }
	            }
	        }
	    }
		// 토큰 없으면 null
		if (token == null) {
	        log.warn("getUserIdFromSession - JWT 토큰 없음 (헤더/쿼리 모두 없음)");
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
			// 실패시 null
			return null;
		}
		
	}
	
	public List<Integer> getConnectedUserIdsInRoom(Integer roomId) {
	    List<Integer> connectedUserIds = new ArrayList<>();
	    for (Map.Entry<Integer, WebSocketSession> entry : userSessions.entrySet()) {
	        Integer userId = entry.getKey();
	        WebSocketSession session = entry.getValue();
	        if (session != null && session.isOpen()) {
	            // roomId와 연결시, session에 roomId 정보가 있다고 가정해야 함!
	            // 예: session.getAttributes().get("roomId") 등
	            Object sessionRoomId = session.getAttributes().get("roomId");
	            if (sessionRoomId != null && sessionRoomId.equals(roomId)) {
	                connectedUserIds.add(userId);
	            }
	        }
	    }
	    log.info("Connected users in room {}: {}", roomId, connectedUserIds);
	    return connectedUserIds;
	}
	
	// markMessagesAsRead 서비스 호출 (메시지 읽음 처리)
    private void markMessagesAsRead(Integer roomId, Integer userId) {
        chatRoomService.markMessagesAsRead(roomId, userId);
    }
    
    /**
     * WebSocketSession에서 roomId를 추출하는 메서드
     * - session.getAttributes().get("roomId") 또는
     * - session.getUri().getQuery()에서 accessToken, roomId 등을 파싱
     */
    private Integer getRoomIdFromSession(WebSocketSession session) {
        // 1. session attributes에서 roomId 추출
        Object attrRoomId = session.getAttributes().get("roomId");
        if (attrRoomId != null) {
            try {
                return Integer.parseInt(attrRoomId.toString());
            } catch (NumberFormatException e) {
                log.warn("roomId attribute is not a valid integer: {}", attrRoomId);
            }
        }

        // 2. URI query string에서 roomId=xxx 파싱 (예: ws://host?roomId=26&accessToken=xxx)
        String query = session.getUri().getQuery();
        if (query != null) {
            for (String param : query.split("&")) {
                String[] kv = param.split("=");
                if (kv.length == 2 && kv[0].equals("roomId")) {
                    try {
                        return Integer.parseInt(kv[1]);
                    } catch (NumberFormatException e) {
                        log.warn("roomId query param is not a valid integer: {}", kv[1]);
                    }
                }
            }
        }

        // 못 찾으면 null 반환
        return null;
    }
	
}
