package com.goodee.coreconnect.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.goodee.coreconnect.chat.handler.ChatWebSocketHandler;
import com.goodee.coreconnect.common.notification.handler.NotificationWebSocketHandler;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig  implements WebSocketConfigurer {

	// 기존 WebSocketHandler 대신 두 개의 핸들러를 주입
    private final ChatWebSocketHandler chatWebSocketHandler;
    private final NotificationWebSocketHandler notificationWebSocketHandler;
	
	
	@Override
	public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
	  
		// 채팅용 WebSocket 엔드포인트 등록
        registry.addHandler(chatWebSocketHandler, "/ws/chat")
                .setAllowedOrigins("http://localhost:5173");

        // 알림용 WebSocket 엔드포인트 등록
        registry.addHandler(notificationWebSocketHandler, "/ws/notification")
                .setAllowedOrigins("http://localhost:5173");
	}
}
