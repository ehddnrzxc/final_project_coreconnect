package com.goodee.coreconnect.user.service;

import java.io.IOException;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.common.S3Service;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final S3Service s3Service;

    /**
     * 이미지 업로드
     * S3에 이미지를 업로드하고, 사용자 엔터티에 profileImageKey를 저장.
     * MultipartFile을 받아 S3에 업로드하므로, 프론트엔드에서 multifile/form-data로 파일을 전송해야 함.
     * 
     * @param email
     * @param file
     * @throws IOException
     */
    public void updateProfileImage(String email, MultipartFile file) throws IOException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        // S3에 업로드
        String key = s3Service.uploadProfileImage(file, user.getName());
        user.setProfileImageKey(key);

        userRepository.save(user);
    }

    /**
     * 이미지 URL 조회
     * 사용자의 profileImageKey를 기반으로 S3 URL을 반환하거나, 기본 이미지(/images/default.png) 반환.
     *
     * @param user
     * @return
     */
    public String getProfileImageUrl(User user) {
        if (user.getProfileImageKey() == null) return "/images/default.png";
        return s3Service.getFileUrl(user.getProfileImageKey());
    }
}
