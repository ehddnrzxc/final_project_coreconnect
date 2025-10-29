package com.goodee.coreconnect.common.notification.service;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class WebSocketDeliveryService {

	private final Map<Integer, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

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
        if (userId == null || payload == null) return false;
        WebSocketSession s = sessions.get(userId);
        if (s == null || !s.isOpen()) return false;
        try {
            String text = objectMapper.writeValueAsString(payload);
            s.sendMessage(new TextMessage(text));
            return true;
        } catch (IOException e) {
            // log.warn...
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
