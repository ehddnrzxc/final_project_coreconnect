package com.goodee.coreconnect.config;

import java.util.Map;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.Cookie;

public class WebSocketAuthInterceptor implements HandshakeInterceptor {

	@Override
	public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler,
			Map<String, Object> attributes) throws Exception {
		  if (request instanceof ServletServerHttpRequest servletRequest) {
	            HttpServletRequest req = servletRequest.getServletRequest();
	            Cookie[] cookies = req.getCookies();
	            if (cookies != null) {
	                for (Cookie cookie : cookies) {
	                    if ("access_token".equals(cookie.getName())) {
	                        attributes.put("access_token", cookie.getValue());
	                        // 실제 JWT 파싱해서 userId/userEmail까지 attribute로 넣어도 좋음!
	                        System.out.println("[WebSocketAuthInterceptor] access_token 쿠키 발견 및 attribute 저장!");
	                    }
	                }
	            }else {
	                System.out.println("[WebSocketAuthInterceptor] Cookie 없음!");
	            }
	        } else {
	            System.out.println("[WebSocketAuthInterceptor] 요청이 ServletServerHttpRequest 아님!");
	        
	        }
	        return true;
	}

	@Override
	public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler,
			Exception exception) {
		// TODO Auto-generated method stub
		
	}

}
