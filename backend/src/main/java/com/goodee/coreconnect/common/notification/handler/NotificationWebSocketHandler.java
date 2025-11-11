package com.goodee.coreconnect.common.notification.handler;

import java.util.List;

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

    /**
     * 클라이언트(WebSocket) 연결 시 호출
     */
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String token = (String) session.getAttributes().get("access_token");
        if (token == null) {
        	 System.out.println("[NotificationWebSocketHandler] access_token 없음! 소켓 종료");
            //session.close();
            return;
        }
        try {
            String email = jwtProvider.getSubject(token);
            User user = userRepository.findByEmail(email).orElse(null);
            if (user != null) {
                webSocketDeliveryService.registerSession(user.getId(), session);
                session.getAttributes().put("userId", user.getId()); // userId attribute 저장!
                log.info("WebSocket session registered for userId={}", user.getId());
            } else {
                log.warn("WebSocket: No user found for email. Session closed.");
                session.close();
            }
        } catch (Exception e) {
            log.warn("WebSocket: Invalid JWT. Session closed.");
            session.close();
        }
    }

    /**
     * 클라이언트(WebSocket) 해제 시 호출
     */
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        // 보다 정확하게: 세션 attribute에서 userId 추출
        Integer userId = (Integer) session.getAttributes().get("userId");
        if (userId == null) {
            // 백업: JWT에서 추출(cf. 아래 헬퍼 참고)
            userId = getUserIdFromSession(session);
        }
        // 정확하게 해당 세션만 해제!
        if (userId != null) {
            webSocketDeliveryService.unregisterSession(userId, session);
            log.info("WebSocket session unregistered for userId={}, sessionId={}", userId, session.getId());
        } else {
            log.warn("WebSocket: Unable to unregister session (no userId found), sessionId={}", session.getId());
        }
    }

    /**
     * 텍스트 메시지 수신 시 실행되는 콜백
     * handleTextMessage에서 직접 sendMessage()하지 않고, 항상 service.sendNotification()만 호출
     */
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
    	 // 메시지(JSON) 파싱
        JsonNode node = objectMapper.readTree(message.getPayload());

        // 송신자 ID 추출 (attribute → fallback)
        Integer senderId = (Integer) session.getAttributes().get("userId");
        if (senderId == null) {
            senderId = getUserIdFromSession(session);
        }

        // 수신자, 알림 타입, 메시지 내용 추출
        Integer recipientId = node.has("recipientId") ? node.get("recipientId").asInt() : null;
        String msg = node.has("message") ? node.get("message").asText() : null;
        String typeStr = node.has("type") ? node.get("type").asText() : "EMAIL";
        NotificationType type;
        try {
            type = NotificationType.valueOf(typeStr.toUpperCase());
        } catch (Exception e) {
            type = NotificationType.EMAIL;
        }

        // ⚠️ 부적절한 값(필수 id 없음) 체크!
        if (recipientId == null) {
            log.warn("[WebSocket] handleTextMessage: recipientId가 null입니다. 메시지 무시.");
            return;
        }
        if (senderId == null) {
            log.warn("[WebSocket] handleTextMessage: senderId가 null입니다. 메시지 무시.");
            return;
        }

        // 송신자 이름 조회
        String senderName = null;
        if (senderId != null) {
            User user = userRepository.findById(senderId).orElse(null);
            senderName = user != null ? user.getName() : null;
        }

        // 알림 저장 + 실시간 푸시는 NotificationService에서 일원화
        notificationService.sendNotification(recipientId, type, msg, null, null, senderId, senderName);
    }

    /**
     * WebSocketSession에서 JWT 토큰을 파싱하여 사용자 ID 추출 (백업용)
     */
    private Integer getUserIdFromSession(WebSocketSession session) {
        // 1. Attribute에 userId가 우선 저장돼 있으면 사용
        Object attr = session.getAttributes().get("userId");
        if (attr instanceof Integer) {
            return (Integer) attr;
        }

        // 2. Authorization 헤더에서 Bearer 토큰 추출
        List<String> authHeaders = session.getHandshakeHeaders().get("Authorization");
        String token = null;
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String bearer = authHeaders.get(0);
            if (bearer.startsWith("Bearer ")) {
                token = bearer.substring(7);
            }
        }

        // 3. 쿼리 파라미터 accessToken=xxx 지원 (프론트가 넣을 때)
        if (token == null) {
            String query = session.getUri().getQuery();
            if (query != null && query.startsWith("accessToken=")) {
                token = query.substring("accessToken=".length());
            }
        }

        // 4. attribute에 access_token 있는 경우
        if (token == null) {
            token = (String) session.getAttributes().get("access_token");
        }

        // 토큰 없으면 null 반환
        if (token == null) {
            return null;
        }

        try {
            String email = jwtProvider.getSubject(token);
            User user = userRepository.findByEmail(email).orElse(null);
            return user != null ? user.getId() : null;
        } catch (Exception e) {
            return null;
        }
    }
}