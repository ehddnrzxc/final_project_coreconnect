package com.goodee.coreconnect.config;

import java.util.Map;

import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.socket.WebSocketHandler;

import com.goodee.coreconnect.security.jwt.JwtProvider;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * WebSocket handshake 시 토큰을 검사해서 session attributes 에 사용자 정보 저장
 * - 우선순위: cookie(access_token) -> query param(accessToken)
 * - 토큰 검증 실패 시 핸드쉐이크 거부
 *
 * NOTE: token in query is only fallback for tests/clients that can't use cookies.
 */
@Slf4j
@Component
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

        log.info("[WebSocketAuthInterceptor] 핸드셰이크 시작 - URI: {}", httpReq.getRequestURI());
        
        // (1) 쿠키 우선 조회
        String token = null;
        if (httpReq.getCookies() != null) {
            log.info("[WebSocketAuthInterceptor] 쿠키 개수: {}", httpReq.getCookies().length);
            for (Cookie c : httpReq.getCookies()) {
                log.debug("[WebSocketAuthInterceptor] 쿠키 이름: {}", c.getName());
                if ("access_token".equals(c.getName())) {
                    token = c.getValue();
                    log.info("[WebSocketAuthInterceptor] access_token 쿠키 발견");
                    break;
                }
            }
        } else {
            log.warn("[WebSocketAuthInterceptor] 쿠키가 null입니다");
        }

        // (2) 쿼리 파라미터(fallback) - 이름 다 받아주기
        if (token == null || token.isBlank()) {
            token = httpReq.getParameter("access_token");
            if (token != null) {
                log.info("[WebSocketAuthInterceptor] access_token 쿼리 파라미터 발견");
            }
        }
        if (token == null || token.isBlank()) {
            token = httpReq.getParameter("accessToken");
            if (token != null) {
                log.info("[WebSocketAuthInterceptor] accessToken 쿼리 파라미터 발견");
            }
        }

        if (token == null || token.isBlank()) {
            log.warn("[WebSocketAuthInterceptor] handshake without token (쿠키/쿼리 모두 없음) - reject");
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