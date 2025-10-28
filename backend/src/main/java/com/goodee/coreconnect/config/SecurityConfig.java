package com.goodee.coreconnect.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfigurationSource;

import com.goodee.coreconnect.security.jwt.JwtAuthFilter;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;


@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor // ✅ 이 한 줄이면 아래 생성자 필요 없음
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter; // ← 반드시 final 이어야 함

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {})
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
              .authenticationEntryPoint((req, res, e) -> {
                System.out.println("[SECURITY] 401 AuthenticationEntryPoint: " + e.getMessage());
                res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
              })
              .accessDeniedHandler((req, res, e) -> {
                System.out.println("[SECURITY] 403 AccessDeniedHandler: " + e.getMessage());
                res.sendError(HttpServletResponse.SC_FORBIDDEN);
              })
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/**", "/ws/chat", "/ws/chat/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN") // URL 레벨 보호(중복되도 OK)
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/user/profile-image").authenticated()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter,
                org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        var c = new org.springframework.web.cors.CorsConfiguration();
        c.setAllowedOrigins(java.util.List.of("http://localhost:5173"));
        c.setAllowedMethods(java.util.List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        c.setAllowedHeaders(java.util.List.of("Authorization","Content-Type"));
        c.setAllowCredentials(true);
        var s = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        s.registerCorsConfiguration("/**", c);
        return s;
    }

    @Bean
    public org.springframework.security.crypto.password.PasswordEncoder passwordEncoder() {
        return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
    }
}
