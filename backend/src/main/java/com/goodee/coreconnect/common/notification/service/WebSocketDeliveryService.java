package com.goodee.coreconnect.common.notification.service;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class WebSocketDeliveryService {

	private final Map<Integer, WebSocketSession> sessions = new ConcurrentHashMap<>();
	private final ObjectMapper objectMapper = new ObjectMapper()
		    .registerModule(new JavaTimeModule())
		    .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    // 세션 등록/해제
    public void registerSession(Integer userId, WebSocketSession session) {
        if (userId != null && session != null) {
            sessions.put(userId, session);
        }
    }

    public void unregisterSession(Integer userId) {
        if (userId != null) sessions.remove(userId);
    }

    // 단일 사용자에게 payload 전송 (payload는 직렬화 가능한 객체)
    public boolean sendToUser(Integer userId, Object payload) {
        WebSocketSession s = sessions.get(userId);
        if (s != null && s.isOpen()) {
            try {
                String text = objectMapper.writeValueAsString(payload);
                s.sendMessage(new TextMessage(text));
                log.info("[WebSocketDeliveryService] 메시지 전송 성공: userId={}", userId);
                return true;
            } catch (IOException e) {
                log.warn("[WebSocketDeliveryService] 메시지 전송 실패: userId={}, error={}", userId, e.getMessage());
                return false;
            }
        } else {
            log.warn("[WebSocketDeliveryService] 세션 미등록 or 닫힘: userId={}", userId);
            return false;
        }
    }

    // 여러 사용자에게 동일 payload 전송
    public void sendToUsers(List<Integer> userIds, Object payload) {
        if (userIds == null || userIds.isEmpty() || payload == null) return;
        String text;
        try {
            text = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            return;
        }
        TextMessage msg = new TextMessage(text);
        for (Integer uid : userIds) {
            WebSocketSession s = sessions.get(uid);
            if (s != null && s.isOpen()) {
                try { s.sendMessage(msg); } catch (IOException ignore) { /* log */ }
            }
        }
    }
    
    
}
