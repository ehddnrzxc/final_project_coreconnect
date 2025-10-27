package com.goodee.coreconnect.user.service;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.goodee.coreconnect.common.S3Service;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final S3Service s3Service; // ✅ 기존 S3Service 주입

    // 프로필 이미지 업로드
    public void updateProfileImage(String email, MultipartFile file) throws IOException {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));

        // 1️⃣ S3에 업로드 → key 반환
        String key = s3Service.uploadProfileImage(file, user.getEmail());

        // 2️⃣ DB에 key 저장
        user.setProfileImageKey(key);
        userRepository.save(user);
    }

    // 프로필 이미지 URL 반환
    public String getProfileImageUrlByEmail(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));

        String key = user.getProfileImageKey();
        if (key == null || key.isBlank()) {
            return ""; // 기본 이미지 없으면 빈문자열 or 기본 URL 리턴
        }

        // 3️⃣ S3Service 통해 공개 URL 반환
        return s3Service.getFileUrl(key);
    }
}
