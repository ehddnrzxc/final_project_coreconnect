package com.goodee.coreconnect.security.jwt;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
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

    private final JwtProvider jwtProvider;

    public JwtAuthFilter(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        final String uri = req.getRequestURI();
        final String authHeader = req.getHeader("Authorization");

        System.out.println("[JWT] 요청 URI: " + uri);
        System.out.println("[JWT] Authorization 헤더: " + authHeader);

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

                System.out.println("[JWT] 토큰 subject(email): " + username);
                System.out.println("[JWT] 토큰 role: " + role);

                final List<SimpleGrantedAuthority> authorities =
                    (role != null)
                        ? List.of(new SimpleGrantedAuthority("ROLE_" + role))
                        : List.of();

                final UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(username, null, authorities);

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                SecurityContextHolder.getContext().setAuthentication(authentication);

                System.out.println("[JWT] SecurityContext 인증 등록 완료: " + authentication);

            } catch (Exception e) {
                System.err.println("[JWT] Invalid token: " + e.getMessage());
            }
        }

        // 인증 정보 로그 (컨트롤러 진입 직전)
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("[JWT][After Filter] SecurityContext 인증 정보: " + authentication);
        if (authentication != null) {
            System.out.println("[JWT][After Filter] Principal: " + authentication.getPrincipal());
            System.out.println("[JWT][After Filter] Authorities: " + authentication.getAuthorities());
        }

        chain.doFilter(req, res);
    }
}
