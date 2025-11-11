package com.goodee.coreconnect.common.notification.service;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import lombok.extern.slf4j.Slf4j;

/**
 * WebSocketDeliveryService
 * 
 * - 여러 브라우저/탭의 동시 접속을 지원하기 위해, 한 userId 당 여러 WebSocketSession을 관리한다.
 */
@Slf4j
@Service
public class WebSocketDeliveryService {

    // 동시접속 지원: userId별 여러 세션(Set)
    private final Map<Integer, Set<WebSocketSession>> sessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    /**
     * 유저의 세션 등록 (동일 userId에 여러 세션 동시 등록 지원)
     */
    public void registerSession(Integer userId, WebSocketSession session) {
        if (userId != null && session != null) {
            sessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(session);
            log.info("[WebSocketDeliveryService] 세션 등록: userId={}, sessionId={}", userId, session.getId());
        }
    }

    /**
     * 유저의 세션 해제 (해당 세션만 제거. 모두 종료시 userId항목 삭제)
     */
    public void unregisterSession(Integer userId, WebSocketSession session) {
        if (userId != null && session != null) {
            Set<WebSocketSession> set = sessions.get(userId);
            if (set != null) {
                set.remove(session);
                log.info("[WebSocketDeliveryService] 세션 해제: userId={}, sessionId={}", userId, session.getId());
                if (set.isEmpty()) {
                    sessions.remove(userId);
                }
            }
        }
    }

    /**
     * 단일 사용자(userId)의 모든 세션에 실시간 메시지 전송 
     */
    public boolean sendToUser(Integer userId, Object payload) {
        Set<WebSocketSession> set = sessions.get(userId);
        boolean atLeastOne = false;
        if (set != null && !set.isEmpty()) {
            try {
                String text = objectMapper.writeValueAsString(payload);
                TextMessage msg = new TextMessage(text);
                for (WebSocketSession s : set) {
                    if (s.isOpen()) {
                        s.sendMessage(msg);
                        atLeastOne = true;
                        log.info("[WebSocketDeliveryService] 메시지 전송 성공: userId={}, sessionId={}", userId, s.getId());
                    }
                }
                if (!atLeastOne) {
                    log.warn("[WebSocketDeliveryService] 모든 세션이 닫혀 있음: userId={}", userId);
                }
                return atLeastOne;
            } catch (IOException e) {
                log.warn("[WebSocketDeliveryService] 메시지 직렬화/전송 오류: userId={}, error={}", userId, e.getMessage());
            }
        } else {
            log.warn("[WebSocketDeliveryService] 세션 미등록 or 닫힘: userId={}", userId);
        }
        return false;
    }

    /**
     * 여러 사용자에게 동일 payload 실시간 전송 (각 유저의 모든 세션)
     */
    public void sendToUsers(List<Integer> userIds, Object payload) {
        if (userIds == null || userIds.isEmpty() || payload == null) return;
        String text;
        try {
            text = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.warn("[WebSocketDeliveryService] 메시지 직렬화 실패: {}", e.getMessage());
            return;
        }
        TextMessage msg = new TextMessage(text);
        for (Integer uid : userIds) {
            Set<WebSocketSession> set = sessions.get(uid);
            if (set != null && !set.isEmpty()) {
                for (WebSocketSession s : set) {
                    if (s.isOpen()) {
                        try {
                            s.sendMessage(msg);
                            log.info("[WebSocketDeliveryService] (sendToUsers) 메시지 전송: userId={}, sessionId={}", uid, s.getId());
                        } catch (IOException ignore) {
                            log.warn("[WebSocketDeliveryService] sendToUsers 전송실패: userId={}, sessionId={}", uid, s.getId());
                        }
                    }
                }
            }
        }
    }

    /**
     * 강제로 모든 세션 close (Optional: 테스트 혹은 서버 shutdown시 사용)
     */
    public void closeAll() {
        for (Map.Entry<Integer, Set<WebSocketSession>> entry : sessions.entrySet()) {
            for (WebSocketSession s : entry.getValue()) {
                try {
                    if (s.isOpen()) s.close();
                } catch (IOException ignore) {}
            }
        }
        sessions.clear();
    }
}