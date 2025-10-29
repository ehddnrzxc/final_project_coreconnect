package com.goodee.coreconnect.security.jwt;

import java.security.Key;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.goodee.coreconnect.user.entity.Role;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtProvider {

    // 데모 키(운영에선 환경변수/Secret Manager 사용)
    private static final String SECRET = "this_is_a_very_long_secret_key_for_jwt_example_12345678901234567890";
    private final Key key = Keys.hmacShaKeyFor(SECRET.getBytes());

    /** Access 토큰 생성 (권장: subject는 setSubject로, role은 클레임으로) */
    public String createAccess(String email, Role role, int minutes) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role.name()); 

        return Jwts.builder()
                .setSubject(email) // ✅ 표준 subject
                .addClaims(claims) // ✅ 커스텀 클레임
                .setIssuedAt(new Date())
                .setExpiration(Date.from(Instant.now().plus(Duration.ofMinutes(minutes))))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /** Refresh 토큰 생성 */
    public String createRefresh(String subject, long days) {
        return Jwts.builder()
                .setSubject(subject)
                .setIssuedAt(new Date())
                .setExpiration(Date.from(Instant.now().plus(Duration.ofDays(days))))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /** subject(email) 추출 */
    public String getSubject(String token) {
    	if (token == null || token.trim().isEmpty()) {
            throw new IllegalArgumentException("JWT token must not be null or empty");
        }
        return getAllClaims(token).getSubject();
    }

    /** role 추출 */
    public String getRole(String token) {
        return getAllClaims(token).get("role", String.class);
    }

    /** 공통: 모든 클레임 파싱 */
    private Claims getAllClaims(String token) {
    	if (token == null || token.trim().isEmpty()) {
            throw new IllegalArgumentException("JWT token must not be null or empty");
        }
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /** (옵션) 유효성 검사 */
    public boolean isValid(String token) {
        try {
            getAllClaims(token); // 파싱되면 OK
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
