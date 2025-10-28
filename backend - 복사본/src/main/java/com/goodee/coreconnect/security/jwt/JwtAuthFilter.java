package com.goodee.coreconnect.security.jwt;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
  private final JwtProvider jwt;

  public JwtAuthFilter(JwtProvider jwt){ this.jwt = jwt; }

  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    
	  String uri = req.getRequestURI();
	  
	  // WebSocket handshake 요청인 인증 없이 통과시키기 (핸들러 경로와 일치시킬것!)
	  if (uri.startsWith("/ws/chat")) {
		  chain.doFilter(req, res);
		  return;
	  }
	  
	  // 나머지 요청은 기존 JWT 인증 로직 적용
	  String auth = req.getHeader("Authorization");
    if (auth != null && auth.startsWith("Bearer ")) {
      String token = auth.substring(7);
      try {
        String username = jwt.getSubject(token);
        UsernamePasswordAuthenticationToken at =
            new UsernamePasswordAuthenticationToken(username, null, List.of());
        at.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
        SecurityContextHolder.getContext().setAuthentication(at);
      } catch (Exception ignored) {}
    }
    chain.doFilter(req, res);
  }
}
