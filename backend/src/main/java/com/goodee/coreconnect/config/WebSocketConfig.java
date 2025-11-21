package com.goodee.coreconnect.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.web.socket.config.annotation.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    private final WebSocketAuthInterceptor webSocketAuthInterceptor;
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        log.info("🔥 [WebSocketConfig] STOMP 엔드포인트 등록 시작");
        // 엔드포인트 경로, allow origins 등 설정
        registry.addEndpoint("/ws/chat")
                .setAllowedOrigins("http://localhost:5173", "http://13.125.225.211:5173", "http://13.125.225.211") // 또는 필요한 경우 allowedOrigins 파라미터 넣기
                .addInterceptors(webSocketAuthInterceptor) // WebSocket 인증 인터셉터 추가
                .withSockJS(); // 필요하다면 SockJS 지원도 추가
        log.info("🔥 [WebSocketConfig] /ws/chat 엔드포인트 등록 완료");
        
        // 알림 WebSocket 엔드포인트 (native WebSocket 지원)
        registry.addEndpoint("/ws/notification")
                .setAllowedOrigins("http://localhost:5173", "http://13.125.225.211:5173", "http://13.125.225.211")
                .addInterceptors(webSocketAuthInterceptor) // WebSocket 인증 인터셉터 추가
                .withSockJS(); // SockJS 지원 (프론트엔드에서 native WebSocket도 사용 가능)
        log.info("🔥 [WebSocketConfig] /ws/notification 엔드포인트 등록 완료 (인증 인터셉터 포함)");
        log.info("🔥 [WebSocketConfig] STOMP 엔드포인트 등록 완료");
    }
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        log.info("🔥 [WebSocketConfig] 메시지 브로커 설정 시작");
        // /topic/* 으로 publish 될 메시지는 내부 메시지 브로커에서 관리 (방송)
        registry.enableSimpleBroker("/topic", "/queue");
        log.info("🔥 [WebSocketConfig] SimpleBroker 활성화: /topic, /queue");
        // 클라이언트가 /app으로 시작하는 주소로 send한 메시지는 @MessageMapping 대상으로 전달
        registry.setApplicationDestinationPrefixes("/app");
        log.info("🔥 [WebSocketConfig] ApplicationDestinationPrefixes 설정: /app");
        log.info("🔥 [WebSocketConfig] 메시지 브로커 설정 완료");
    }
    
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        log.info("🔥 [WebSocketConfig] 클라이언트 인바운드 채널 설정 시작");
        // STOMP 메시지가 서버로 들어올 때 인터셉터 추가 가능
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                Object destination = message.getHeaders().get("simpDestination");
                String messageType = message.getHeaders().get("simpMessageType") != null ? 
                        message.getHeaders().get("simpMessageType").toString() : "UNKNOWN";
                
                // ⭐ SEND 메시지 (메시지 전송)에 대한 특별 로그
                if (destination != null && destination.toString().startsWith("/app/")) {
                    log.info("🔥🔥🔥 [WebSocketConfig] ⭐⭐⭐ SEND 메시지 수신 (메시지 전송) ⭐⭐⭐ - destination: {}, messageType: {}, headers: {}", 
                            destination, messageType, message.getHeaders());
                    // ⭐ 메시지 본문도 로그 출력 (디버깅용)
                    Object payload = message.getPayload();
                    if (payload != null) {
                        log.info("🔥🔥🔥 [WebSocketConfig] SEND 메시지 본문: {}", payload);
                    }
                } else {
                    log.info("🔥 [WebSocketConfig] ========== STOMP 메시지 수신 ========== - destination: {}, messageType: {}, headers: {}", 
                            destination, messageType, message.getHeaders());
                }
                return message;
            }
        });
        log.info("🔥 [WebSocketConfig] 클라이언트 인바운드 채널 설정 완료");
    }
}