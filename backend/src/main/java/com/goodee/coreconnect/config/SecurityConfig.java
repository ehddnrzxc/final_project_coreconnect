package com.goodee.coreconnect.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.goodee.coreconnect.security.jwt.JwtAuthFilter;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;


@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

    /*
     * @Value
     * Spring에서 설정 파일(application.properties 등)에 있는 값을 
     * 자바 코드에 주입(Injection)할 때 쓰는 애너테이션이다. 
     * 즉 설정 파일의 값을 읽어서 변수에 자동으로 넣어주는 역할이다. 
     */
    @Value("${security.mode:secure}")
    private String securityMode;
    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {})
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
              .authenticationEntryPoint((req, res, e) -> {
                log.info("[SECURITY] 401 AuthenticationEntryPoint: " + e.getMessage());
                res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
              })
              .accessDeniedHandler((req, res, e) -> {
                log.info("[SECURITY] 403 AccessDeniedHandler: " + e.getMessage());
                res.sendError(HttpServletResponse.SC_FORBIDDEN);
              })
            );
        // 개발용이면 요청 경로 모두 허용, 아니면 기존 설정 유지
        if("open".equalsIgnoreCase(securityMode)) {
          log.info("프로필: 개발용");
          http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        } else {
          log.info("프로필: 배포용");
          http.authorizeHttpRequests(auth -> auth
              // CORS 프리플라이트는 항상 허용
              .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
              // Swagger/OpenAPI 경로 모두 허용
              .requestMatchers(
                  "/v3/api-docs/**",
                  "/swagger-ui/**",
                  "/swagger-ui.html",
                  "/swagger-resources/**",
                  "/webjars/**"
                  ).permitAll()
              // 로그인/회원가입 등 인증 시작 엔드포인트만 오픈
              .requestMatchers("/api/v1/auth/**").permitAll()
              // 나머지 경로는 로그인 필요
              .anyRequest().authenticated()
              )
          .addFilterBefore(jwtAuthFilter,
              org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);
        }

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration c = new CorsConfiguration();
        c.setAllowedOrigins(List.of("http://localhost:5173"));
        c.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        c.setAllowedHeaders(List.of("Authorization","Content-Type"));
        c.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource s = new UrlBasedCorsConfigurationSource();
        s.registerCorsConfiguration("/**", c);
        return s;
    }

    @Bean
    public org.springframework.security.crypto.password.PasswordEncoder passwordEncoder() {
        return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
    }
}
