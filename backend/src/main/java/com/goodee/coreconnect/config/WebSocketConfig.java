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
 */
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final ChatWebSocketHandler chatWebSocketHandler;
    private final NotificationWebSocketHandler notificationWebSocketHandler;
    private final JwtProvider jwtProvider; // <- JwtProvider 주입

    @Value("${app.websocket.allowed-origins:http://localhost:5173}")
    private String allowedOrigins; // comma separated allowed origins

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        String[] origins = allowedOrigins.split(",");

        registry.addHandler(chatWebSocketHandler, "/ws/chat")
                .setAllowedOrigins(origins);

        // interceptor에 jwtProvider를 전달해서 생성
        registry.addHandler(notificationWebSocketHandler, "/ws/notification")
                .addInterceptors(new WebSocketAuthInterceptor(jwtProvider))
                .setAllowedOrigins(origins);
    }
}