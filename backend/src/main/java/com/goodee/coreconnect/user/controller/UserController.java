package com.goodee.coreconnect.user.controller;

import java.io.IOException;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.user.service.UserServiceImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/user")
@Slf4j
public class UserController {

    private final UserServiceImpl userService;

    // 로그인된 사용자 본인 기준 업로드
    @PostMapping("/profile-image")
    public ResponseEntity<String> uploadProfileImage(
            @AuthenticationPrincipal String email, 
            @RequestParam("file") MultipartFile file) throws IOException {
      
        log.info("principal class = " + email.getClass().getName());

    
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
