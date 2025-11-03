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

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

/**
 * JwtAuthFilter
 * - 모든 HTTP 요청마다 한 번씩 실행되는 JWT 인증 필터.
 * - 요청 헤더의 JWT 토큰을 검사하고, 인증 정보(SecurityContext)를 설정한다. 
 * - OncePerRequestFilter를 상속하여 요청당 한 번만 실행되도록 보장한다.
 */
@Component
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    public JwtAuthFilter(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    /**
     * 요청에서 JWT 토큰을 확인하고 검증한 뒤 유효하면 SecurityContext에 인증 정보를 저장하는 메서드
     */
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        final String uri = req.getRequestURI();
        final String authHeader = req.getHeader("Authorization");

        log.info("[JWT] 요청 URI: " + uri);
        log.info("[JWT] Authorization 헤더: " + authHeader);

        // WebSocket 인증 제외
        // WebSocket 연결에서는 핸드쉐이크 과정이 HTTP와 다르기 때문에 JWT 인증을 따로 적용하거나 핸들러에서 직접 인증을 처리하는 경우가 많음
        // Swagger, API Docs, WebSocket 인증 제외
        if (
    	    uri.startsWith("/ws/chat") ||
    	    uri.equals("/swagger-ui.html") ||
    	    uri.startsWith("/swagger-ui/") ||
    	    uri.startsWith("/v3/api-docs") ||
    	    uri.startsWith("/swagger-resources") ||
    	    uri.startsWith("/webjars")
    	) {
    	    chain.doFilter(req, res);
    	    return;
    	}

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            final String token = authHeader.substring(7);

            try {
                final String username = jwtProvider.getSubject(token);
                final String role = jwtProvider.getRole(token);

                log.info("[JWT] 토큰 subject(email): " + username);
                log.info("[JWT] 토큰 role: " + role);

                final List<SimpleGrantedAuthority> authorities =
                    (role != null)
                        ? List.of(new SimpleGrantedAuthority("ROLE_" + role))
                        : List.of();

                final UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(username, null, authorities);

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.info("[JWT] SecurityContext 인증 등록 완료: " + authentication);

            } catch (Exception e) {
              log.info("[JWT] Invalid token: " + e.getMessage());
            }
        }

        // 인증 정보 로그 (컨트롤러 진입 직전)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        log.info("[JWT][After Filter] SecurityContext 인증 정보: " + authentication);
        if (authentication != null) {
          log.info("[JWT][After Filter] Principal: " + authentication.getPrincipal());
          log.info("[JWT][After Filter] Authorities: " + authentication.getAuthorities());
        }

        chain.doFilter(req, res);
    }
}
