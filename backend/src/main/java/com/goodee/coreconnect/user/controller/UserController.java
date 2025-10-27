package com.goodee.coreconnect.user.controller;

import java.io.IOException;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.user.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    // 로그인된 사용자 본인 기준 업로드
    @PostMapping("/profile-image")
    public ResponseEntity<String> uploadProfileImage(
            @AuthenticationPrincipal String email, // ✅ JWT에서 추출된 이메일
            @RequestParam("file") MultipartFile file) throws IOException {

        userService.updateProfileImage(email, file);
        return ResponseEntity.ok("프로필 이미지 업로드 성공");
    }

    // 로그인된 사용자 본인 기준 조회
    @GetMapping("/profile-image")
    public ResponseEntity<Map<String, String>> getProfileImageUrl(
            @AuthenticationPrincipal String email) {

        String imageUrl = userService.getProfileImageUrlByEmail(email);
        return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
    }
}
