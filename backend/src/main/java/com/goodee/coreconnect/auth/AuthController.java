package com.goodee.coreconnect.auth;

import java.time.Duration;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.security.jwt.JwtProvider;
import com.goodee.coreconnect.user.entity.Role;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth API", description = "로그인/토큰재발급/로그아웃 API")
public class AuthController {
  private final JwtProvider jwt;
  private final UserRepository userRepository;  
  private final PasswordEncoder passwordEncoder;

  @Operation(summary = "로그인", 
             description = "이메일/비밀번호로 로그인하여 Access Token(응답 본문)과 Refresh Token(HttpOnly 쿠키)을 발급합니다.")
  @PostMapping("/login")
  public ResponseEntity<Map<String, Object>> login(
      @RequestBody Map<String, String> body,
      HttpServletResponse res) {

      // ✅ 요청값 받기
      String email = body.get("email");
      String password = body.get("password");
      
      // ✅ 1. 이메일로 사용자 조회
      User user = userRepository.findByEmail(email).orElse(null);
      if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
      // ✅ 2. 비밀번호 비교 (BCrypt)
      if (!passwordEncoder.matches(password, user.getPassword()))
          return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

      // ✅ 사용자 실제 Role 사용
      Role role = user.getRole();

      // ✅ 3. 토큰 생성
      String access = jwt.createAccess(email, role, 10);   // 10분짜리 Access Token
      String refresh = jwt.createRefresh(email, 7);  // 7일짜리 Refresh Token

      // ✅ 4. HttpOnly Refresh Token 쿠키 설정
      ResponseCookie cookie = ResponseCookie.from("refresh_token", refresh)
          .httpOnly(true)
          .secure(false)       // 로컬 개발 환경은 false (배포 시 true)
          .sameSite("Lax")     // 로컬일 땐 Lax, 도메인 분리 시 None + secure(true)
          .path("/")
          .maxAge(Duration.ofDays(7))
          .build();

      res.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

      // ✅ 5. 응답 데이터 (AccessToken + 사용자 정보)
      Map<String, Object> result = Map.of(
          "accessToken", access,
          "user", Map.of(
              "email", user.getEmail(),
              "name", user.getName(),
              "role", user.getRole().name()
          )
      );

      return ResponseEntity.ok(result);
  }

  @Operation(summary = "Refresh Token", description = "만료된 Access Token을 Refresh Token(쿠키)로 재발급합니다.")
  @PostMapping("/refresh")
  public ResponseEntity<Map<String,String>> refresh(
      @CookieValue(name="refresh_token", required=false) String refresh) {
    if (refresh == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    try {
      String email = jwt.getSubject(refresh);
      Role role = Role.valueOf(jwt.getRole(refresh));
      String newAccess = jwt.createAccess(email, role, 10);
      return ResponseEntity.ok(Map.of("accessToken", newAccess));
    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
  }

  @Operation(summary = "로그아웃", description = "Refresh Token을 제거하고 로그아웃 기능을 수행합니다.")
  @PostMapping("/logout")
  public ResponseEntity<Void> logout(HttpServletResponse res) {
    ResponseCookie delete = ResponseCookie.from("refresh_token", "")
        .httpOnly(true).secure(true).sameSite("Lax").path("/").maxAge(0).build();
    res.addHeader(HttpHeaders.SET_COOKIE, delete.toString());
    return ResponseEntity.noContent().build();
  }
}