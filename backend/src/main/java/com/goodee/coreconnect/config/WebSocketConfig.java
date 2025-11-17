package com.goodee.coreconnect.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 엔드포인트 경로, allow origins 등 설정
        registry.addEndpoint("/ws/chat")
                .setAllowedOrigins("http://localhost:5173") // 또는 필요한 경우 allowedOrigins 파라미터 넣기
                .withSockJS(); // 필요하다면 SockJS 지원도 추가
        // registry.addEndpoint("/ws/notification") ... 도 가능
    }
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // /topic/* 으로 publish 될 메시지는 내부 메시지 브로커에서 관리 (방송)
        registry.enableSimpleBroker("/topic");
        // 클라이언트가 /app으로 시작하는 주소로 send한 메시지는 @MessageMapping 대상으로 전달
        registry.setApplicationDestinationPrefixes("/app");
    }
}