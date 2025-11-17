package com.goodee.coreconnect.config;

import java.util.Map;

import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.socket.server.HandshakeFailureException;
import org.springframework.web.socket.WebSocketHandler;

import com.goodee.coreconnect.security.jwt.JwtProvider;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * WebSocket handshake 시 토큰을 검사해서 session attributes 에 사용자 정보 저장
 * - 우선순위: query param(accessToken) -> cookie(access_token)
 * - 토큰 검증 실패 시 핸드쉐이크 거부
 *
 * NOTE: token in query is only fallback for tests/clients that can't use cookies.
 */
@Slf4j
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements HandshakeInterceptor {

    private final JwtProvider jwtProvider;

    @Override
    public boolean beforeHandshake(org.springframework.http.server.ServerHttpRequest request,
                                   org.springframework.http.server.ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) throws Exception {
        if (!(request instanceof ServletServerHttpRequest)) {
            return true;
        }
        ServletServerHttpRequest servletReq = (ServletServerHttpRequest) request;
        HttpServletRequest httpReq = servletReq.getServletRequest();

     // (1) 쿠키 우선 조회
        String token = null;
        if (httpReq.getCookies() != null) {
            for (Cookie c : httpReq.getCookies()) {
                if ("access_token".equals(c.getName())) {
                    token = c.getValue();
                    break;
                }
            }
        }

        // (2) 쿼리 파라미터(fallback) - 이름 다 받아주기
        if (token == null || token.isBlank()) {
            token = httpReq.getParameter("access_token");
        }
        if (token == null || token.isBlank()) {
            token = httpReq.getParameter("accessToken");
        }

        if (token == null || token.isBlank()) {
            log.warn("[WebSocketAuthInterceptor] handshake without token (쿠키/쿼리 모두 없음) - reject");
            return false;
        }

        // ↓ 테스트 편의 또는 SDK 용만 허용하려면 fallback (선택)
        if (token == null) {
            token = httpReq.getParameter("accessToken");
        }

        if (token == null || token.isBlank()) {
            log.warn("[WebSocketAuthInterceptor] handshake without token - reject");
            return false;
        }

        try {
            if (!jwtProvider.isValid(token)) {
                log.warn("[WebSocketAuthInterceptor] invalid token during websocket handshake");
                return false;
            }
            String email = jwtProvider.getSubject(token);
            if (email == null || email.isBlank()) {
                log.warn("[WebSocketAuthInterceptor] token has no subject - reject");
                return false;
            }
            // 저장: NotificationWebSocketHandler will read "wsUserEmail" (or userId if you prefer)
            attributes.put("wsUserEmail", email);
            attributes.put("access_token", token);
            return true;
        } catch (Exception e) {
            log.warn("[WebSocketAuthInterceptor] token parsing error: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public void afterHandshake(org.springframework.http.server.ServerHttpRequest request,
                               org.springframework.http.server.ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // no-op
    }
}