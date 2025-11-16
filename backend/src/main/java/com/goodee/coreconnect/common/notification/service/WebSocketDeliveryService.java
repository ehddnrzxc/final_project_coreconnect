package com.goodee.coreconnect.common.notification.service;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import jakarta.annotation.PostConstruct;

import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.goodee.coreconnect.common.notification.dto.NotificationPayload;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * WebSocketDeliveryService (멀티 인스턴스/클러스터용 Redis pub/sub 연동)
 * 
 * 변경 요약:
 * - userId별로 여러 WebSocketSession을 관리(동시 다중 접속 지원)
 * - Redis pub/sub를 구독(MessageListener)하여 타 인스턴스에서 publish된 알림도 수신함.
 * - sendToUser는 local 세션에 비동기로 메시지를 전송
 * - Redis 채널 등록/구독은 @PostConstruct로 initialization
 * 
 * 반드시 NotificationService(등)에서 afterCommit에서 redisTemplate.convertAndSend(...)를 호출해줘야 멀티노드에서 전파됨
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketDeliveryService implements MessageListener {

    // ------------------------ 필드 선언부 ------------------------

    /** userId별로 여러 세션 동시 관리 (멀티탭/멀티장치 지원) */
    private final Map<Integer, CopyOnWriteArraySet<WebSocketSession>> sessions = new ConcurrentHashMap<>();

    /** Jackson ObjectMapper (JSR310 모듈등록, 직렬화 오류 방지) */
    private final ObjectMapper objectMapper;

    /** Redis publish/publish 기능 (StringRedisTemplate) */
    private final StringRedisTemplate redisTemplate;

    /** RedisListenerContainer - Redis pub/sub 구독 채널 관리 */
    private final RedisMessageListenerContainer redisListenerContainer;

    /** 비동기 전송용 작업 스레드풀 (I/O blocking 방지) */
    private final ExecutorService sendExecutor = Executors.newFixedThreadPool(Math.max(4, Runtime.getRuntime().availableProcessors() * 2));

    /** Redis pub/sub 전파용 채널명 */
    private final String CHANNEL = "notifications";

    // ------------------------ 초기화 (구독 등록) ------------------------

    /**
     * @PostConstruct
     * 애플리케이션이 스프링 컨테이너에 의해 생성될 때 Redis pub/sub 채널 구독을 등록한다.
     * (이 메서드가 실행되어야 여러 인스턴스에서 동기화가 보장됨)
     */
    @PostConstruct
    public void init() {
        if (redisListenerContainer != null) {
            redisListenerContainer.addMessageListener(this, new PatternTopic(CHANNEL));
            log.info("[WebSocketDeliveryService] Redis pub/sub '{}' 구독 등록 완료", CHANNEL);
        }
    }

    // ------------------------ 세션 등록/해제 ------------------------

    /**
     * 특정 사용자(userId)의 세션을 등록. (탭/장치 추가 지원)
     * @param userId int
     * @param session WebSocketSession
     */
    public void registerSession(Integer userId, WebSocketSession session) {
        if (userId != null && session != null) {
            sessions.computeIfAbsent(userId, k -> new CopyOnWriteArraySet<>()).add(session);
            log.info("[WebSocketDeliveryService] 세션 등록: userId={}, sessionId={}", userId, session.getId());
        }
    }

    /**
     * 특정 사용자(userId)의 세션을 해제. (단일 세션 종료시 호출, 모두 해제되면 map에서 userId 제거)
     * @param userId int
     * @param session WebSocketSession
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

    // ------------------------ 메시지 전송 (local 세션) ------------------------

    /**
     * 단일 사용자(userId)의 모든 세션에 실시간 메시지 전송 (각 세션에 비동기로 전송, I/O blocking 최소화)
     * @param userId int
     * @param payload 직렬화 가능 객체 (예: NotificationPayload)
     * @return 적어도 1개의 실제 세션에 전송되었는지 여부
     */
    public boolean sendToUser(Integer userId, Object payload) {
        Set<WebSocketSession> set = sessions.get(userId);
        boolean atLeastOne = false;
        if (set != null && !set.isEmpty()) {
            final String text;
            try {
                // 객체 직렬화 (LocalDateTime 등)
                text = objectMapper.writeValueAsString(payload);
            } catch (IOException e) {
                log.warn("[WebSocketDeliveryService] 메시지 직렬화 오류: userId={}, error={}", userId, e.getMessage());
                return false;
            }
            TextMessage msg = new TextMessage(text);
            // 각 세션(멀티탭/멀티장치)에 비동기로 전송
            for (WebSocketSession s : set) {
                sendExecutor.execute(() -> {
                    if (s.isOpen()) {
                        try {
                            s.sendMessage(msg);
                            log.info("[WebSocketDeliveryService] 메시지 전송 성공: userId={}, sessionId={}", userId, s.getId());
                        } catch (IOException e) {
                            log.warn("[WebSocketDeliveryService] 메시지 전송 실패: userId={}, sessionId={}, err={}", userId, s.getId(), e.getMessage());
                            unregisterSession(userId, s);
                        }
                    }
                });
                atLeastOne = true;
            }
            if (!atLeastOne) {
                log.warn("[WebSocketDeliveryService] 모든 세션이 닫혀 있음: userId={}", userId);
            }
            return atLeastOne;
        } else {
            log.warn("[WebSocketDeliveryService] 세션 미등록 or 닫힘: userId={}", userId);
        }
        return false;
    }

    /**
     * 여러 사용자에게 동일 payload 실시간 전송 (각 유저의 모든 세션)
     * @param userIds List<Integer>
     * @param payload Object
     */
    public void sendToUsers(List<Integer> userIds, Object payload) {
        if (userIds == null || userIds.isEmpty() || payload == null) return;
        final String text;
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
                    sendExecutor.execute(() -> {
                        if (s.isOpen()) {
                            try {
                                s.sendMessage(msg);
                                log.info("[WebSocketDeliveryService] (sendToUsers) 메시지 전송: userId={}, sessionId={}", uid, s.getId());
                            } catch (IOException ignore) {
                                log.warn("[WebSocketDeliveryService] sendToUsers 전송실패: userId={}, sessionId={}", uid, s.getId());
                                unregisterSession(uid, s);
                            }
                        }
                    });
                }
            }
        }
    }

    // ------------------------ Redis pub/sub 수신 핸들러 ------------------------

    /**
     * onMessage (Redis pub/sub)
     * - 타 인스턴스에서 publish된 메시지를 수신했을 때 호출됨.
     * - 수신한 알림 payload를 해당 user의 로컬 세션에 전송함.
     * @param message Redis Message 객체
     * @param pattern 채널 패턴(byte[])
     */
    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String body = new String(message.getBody());
            NotificationPayload payload = objectMapper.readValue(body, NotificationPayload.class);
            if (payload.getRecipientId() != null) {
                sendToUser(payload.getRecipientId(), payload);
                log.info("[WebSocketDeliveryService] Redis 수신 후 세션 알림: recipientId={}", payload.getRecipientId());
            }
        } catch (Exception e) {
            log.warn("[WebSocketDeliveryService] Redis 메시지 처리 오류: {}", e.getMessage());
        }
    }

    // ------------------------ 전체 세션 종료 ------------------------

    /**
     * 강제로 모든 세션 close
     * (Optional: 테스트 혹은 서버 shutdown시 모든 연결 해제)
     */
    public void closeAll() {
        for (Map.Entry<Integer, CopyOnWriteArraySet<WebSocketSession>> entry : sessions.entrySet()) {
            for (WebSocketSession s : entry.getValue()) {
                try {
                    if (s.isOpen()) s.close();
                } catch (IOException ignore) {}
            }
        }
        sessions.clear();
    }
}