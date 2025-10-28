package com.goodee.coreconnect.user.controller;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    @PostMapping("/{id}/profile-image")
    public ResponseEntity<String> uploadProfileImage(
            @PathVariable String email,
            @RequestParam("file") MultipartFile file) throws IOException {
        userService.updateProfileImage(email, file);
        return ResponseEntity.ok("프로필 이미지 업로드 성공");
    }
    
    @GetMapping("/profile-image")
    public ResponseEntity<Map<String, String>> getProfileImageUrl(@AuthenticationPrincipal User user) {
        String imageUrl = userService.getProfileImageUrl(user);
        return ResponseEntity.ok(Collections.singletonMap("imageUrl", imageUrl));
    }
}