package com.goodee.coreconnect.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.goodee.coreconnect.common.notification.handler.NotificationWebSocketHandler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Notification WebSocket 설정
 * - 일반 WebSocket 핸들러 (STOMP 아님)
 * - SockJS 지원
 */
@Slf4j
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class NotificationWebSocketConfig implements WebSocketConfigurer {
    
    private final NotificationWebSocketHandler notificationWebSocketHandler;
    private final WebSocketAuthInterceptor webSocketAuthInterceptor;
    
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        log.info("🔥 [NotificationWebSocketConfig] 알림 WebSocket 핸들러 등록 시작");
        
        registry.addHandler(notificationWebSocketHandler, "/ws/notification")
                .setAllowedOrigins("http://localhost:5173", "http://13.125.225.211:5173", "http://13.125.225.211")
                .addInterceptors(webSocketAuthInterceptor) // WebSocket 인증 인터셉터 추가
                .withSockJS(); // SockJS 지원
        
        log.info("🔥 [NotificationWebSocketConfig] /ws/notification 핸들러 등록 완료 (SockJS 지원)");
    }
}

