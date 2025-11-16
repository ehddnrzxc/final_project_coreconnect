package com.goodee.coreconnect.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.goodee.coreconnect.chat.handler.ChatWebSocketHandler;
import com.goodee.coreconnect.common.notification.handler.NotificationWebSocketHandler;
import com.goodee.coreconnect.security.jwt.JwtProvider;

import lombok.RequiredArgsConstructor;

/**
 * WebSocket 설정: 핸들러 등록 + 인증 인터셉터 주입
 * - allowed origins 는 app.websocket.allowed-origins 프로퍼티로 관리
 * - 프로덕션에서는 정확한 https://your-frontend 도메인을 넣으세요.
 */
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final ChatWebSocketHandler chatWebSocketHandler;
    private final NotificationWebSocketHandler notificationWebSocketHandler;
    private final JwtProvider jwtProvider;

    /**
     * app.websocket.allowed-origins 에는 쉼표(,)로 구분한 origin 목록을 넣으세요.
     * 예: https://app.example.com,https://admin.example.com
     * 개발시 여러 origin을 허용하려면 http://localhost:5173,http://localhost:3000 등
     */
    @Value("${app.websocket.allowed-origins:http://localhost:5173}")
    private String allowedOrigins; // comma separated

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // split and trim
        String[] origins = java.util.Arrays.stream(allowedOrigins.split(","))
                                .map(String::trim)
                                .filter(s -> !s.isEmpty())
                                .toArray(String[]::new);

        // Chat (예시)
        registry.addHandler(chatWebSocketHandler, "/ws/chat")
                // setAllowedOriginPatterns 허용: 패턴 또는 정확한 도메인 지정 가능
                .setAllowedOriginPatterns(origins);

        // Notification 핸들러: interceptor에 jwtProvider 전달
        registry.addHandler(notificationWebSocketHandler, "/ws/notification")
                .addInterceptors(new WebSocketAuthInterceptor(jwtProvider))
                .setAllowedOriginPatterns(origins);
    }
}