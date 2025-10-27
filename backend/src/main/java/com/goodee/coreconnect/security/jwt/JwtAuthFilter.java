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

        // ✅ WebSocket 요청은 인증 없이 통과
        if (uri.startsWith("/ws/chat")) {
            chain.doFilter(req, res);
            return;
        }

        final String authHeader = req.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            final String token = authHeader.substring(7);

            try {
                final String username = jwtProvider.getSubject(token);
                final String role = jwtProvider.getRole(token); // role 클레임 추출 (JwtProvider에 구현 필요)

                // ✅ 권한 설정
                final List<SimpleGrantedAuthority> authorities = 
                    (role != null)
                        ? List.of(new SimpleGrantedAuthority("ROLE_" + role))
                        : List.of();

                // ✅ 인증 토큰 생성
                final UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(username, null, authorities);

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                SecurityContextHolder.getContext().setAuthentication(authentication);

            } catch (Exception e) {
                // JWT 검증 실패 시 로그만 남기고 통과 (인증 실패 상태 유지)
                System.err.println("[JWT] Invalid token: " + e.getMessage());
            }
        }

        chain.doFilter(req, res);
    }
}
