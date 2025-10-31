package com.goodee.coreconnect.chat.handler;

import java.util.ArrayList;
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
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.goodee.coreconnect.chat.dto.response.ChatResponseDTO;
import com.goodee.coreconnect.chat.entity.Chat;
import com.goodee.coreconnect.chat.service.ChatRoomService;
import com.goodee.coreconnect.common.notification.service.WebSocketDeliveryService;
import com.goodee.coreconnect.security.jwt.JwtProvider;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler{	
	// 채팅방 관련 서비스
    private final ChatRoomService chatRoomService;
    // JWT 토큰 파싱을 위한 프로바이더
    private final JwtProvider jwtProvider;
    // 사용자 정보 조회용 레포지토리
    private final UserRepository userRepository;
    // 실시간 메시지 전송을 위한 공통 서비스
    private final WebSocketDeliveryService webSocketDeliveryService;

    // JSON 파싱을 위한 ObjectMapper (JavaTimeModule 등록)
    private final ObjectMapper objectMapper = new ObjectMapper()
    		.registerModule(new JavaTimeModule())
    		.disable(SerializationFeature.WRITE_DATE_TIMESTAMPS_AS_NANOSECONDS);// ISO8601 포맷으로 직렬화
    // 사용자 ID별 WebSocketSession 관리용 맵
    private final Map<Integer, WebSocketSession> userSessions = new ConcurrentHashMap<>();
	
    // 클라잉너트 websocket 연결 시 호출
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
    	// JWT에서 사용자 ID 추출
    	Integer userId = getUserIdFromSession(session);
    	if (userId != null) {
    		// 세션을 맵에 등록
    		userSessions.put(userId, session);
    		webSocketDeliveryService.registerSession(userId, session);
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
		// 메시지(JSON) 파싱
		JsonNode node = objectMapper.readTree(message.getPayload());
		Integer senderId = getUserIdFromSession(session); // 송신자 ID 추출

        // roomId, content 추출
        Integer roomId = node.has("roomId") ? node.get("roomId").asInt() : null; // roomId 추출
        String chatContent = node.has("content") ? node.get("content").asText() : null; // 채팅 내용 추출
        if (roomId == null || chatContent == null) return; // 값 없으면 처리 중단

        // 채팅 저장 (서비스에서 구현 필요)
        Chat chat = chatRoomService.sendChatMessage(roomId, senderId, chatContent); // chat 저장 로직

        // 참여자 목록 조회
        List<Integer> participantIds = chatRoomService.getParticipantIds(roomId);

        // 채팅 메시지 DTO 생성
        ChatResponseDTO dto = ChatResponseDTO.builder()
                .id(chat.getId()) // 메시지 PK
                .messageContent(chat.getMessageContent()) // 메시지 내용
                .sendAt(chat.getSendAt()) // 발송 시각
                .fileYn(chat.getFileYn()) // 파일 여부
                .fileUrl(chat.getFileUrl()) // 파일 URL
                .roomId(chat.getChatRoom().getId()) // 채팅방 PK
                .senderId(senderId) // 송신자 PK
                .senderName(chat.getSender() != null ? chat.getSender().getName() : null) // 송신자 이름
                .notificationType("CHAT") // 문자열 "CHAT" 직접 할당 (enum 사용x)
                .build();

        String payload = objectMapper.writeValueAsString(dto); // DTO를 JSON 문자열로 직렬화

        // 참여자들에게 메시지 푸시
        for (Integer pid : participantIds) {
            WebSocketSession s = userSessions.get(pid); // 참여자 세션 조회
            if (s != null && s.isOpen()) {
                s.sendMessage(new TextMessage(payload)); // 메시지 전송
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
			}
		}
		
		if (token == null) {
			// 쿼리 파라미터에서 accessToken 추출
			String query = session.getUri().getQuery();
			if (query != null && query.startsWith("accessToken=")) {
				token = query.substring("accessToken=".length());
			}
		}
		
		// 토큰 없으면 null
		if (token == null) return null; // 토큰 없으면 null 반환
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
	    return connectedUserIds;
	}
	
}
