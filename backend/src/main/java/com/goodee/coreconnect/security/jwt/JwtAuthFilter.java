package com.goodee.coreconnect.security.jwt;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.goodee.coreconnect.security.userdetails.CustomUserDetails;
import com.goodee.coreconnect.security.userdetails.CustomUserDetailsService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * JwtAuthFilter
 * - 모든 HTTP 요청마다 한 번씩 실행되는 JWT 인증 필터.
 * - 요청 헤더의 JWT 토큰을 검사하고, 인증 정보(SecurityContext)를 설정한다. 
 * - OncePerRequestFilter를 상속하여 요청당 한 번만 실행되도록 보장한다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final CustomUserDetailsService customUserDetailsService;

    /**
     * 요청에서 JWT 토큰을 확인하고 검증한 뒤 유효하면 SecurityContext에 인증 정보를 저장하는 메서드
     */
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        final String uri = req.getRequestURI();
        log.debug("[JWT] 요청 URI: {}", uri);
        
        // Swagger, API Docs, WebSocket, refresh 등 예외 경로
        if (
    	    uri.startsWith("/ws/chat") ||
    	    uri.equals("/swagger-ui.html") ||
    	    uri.startsWith("/swagger-ui/") ||
    	    uri.startsWith("/v3/api-docs") ||
    	    uri.startsWith("/swagger-resources") ||
    	    uri.startsWith("/webjars") ||
    	    uri.startsWith("/api/v1/auth/refresh")
    	  ) {
    	    chain.doFilter(req, res);
    	    return;
    	  }
        
        // 토큰을 쿠키에서 꺼내기
        String token = resolveTokenFromCookie(req);
          if(token != null) {
            try {
                final String email = jwtProvider.getSubject(token);

                log.debug("[JWT] 토큰 subject(email): " + email);
                
                // DB에서 사용자 조회 -> CustomUserDetails 생성
                CustomUserDetails userDetails = (CustomUserDetails) customUserDetailsService.loadUserByUsername(email);                      
                
                final UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.debug("[JWT] SecurityContext 인증 등록 완료: " + authentication);

            } catch (Exception e) {
              log.error("[JWT] Invalid token: " + e);
            }
        } else {
          log.debug("[JWT] 요청에 access_token 쿠키가 없습니다.");
        }

        // 인증 정보 로그 (컨트롤러 진입 직전)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        log.debug("[JWT][After Filter] SecurityContext 인증 정보: " + authentication);
        if (authentication != null) {
          log.debug("[JWT][After Filter] Principal: " + authentication.getPrincipal());
          log.debug("[JWT][After Filter] Authorities: " + authentication.getAuthorities());
        }

        chain.doFilter(req, res);
    }
    
    /**
     * HttpOnly 쿠키에서 access_token 값을 추출하는 메서드
     */
    private String resolveTokenFromCookie(HttpServletRequest req) {
        Cookie[] cookies = req.getCookies();
        if (cookies == null) {
            return null;
        }

        for (Cookie cookie : cookies) {
            if ("access_token".equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
