package com.goodee.coreconnect.user.service;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.goodee.coreconnect.common.S3Service;
import com.goodee.coreconnect.department.entity.Department;
import com.goodee.coreconnect.department.repository.DepartmentRepository;
import com.goodee.coreconnect.user.dto.request.CreateUserReq;
import com.goodee.coreconnect.user.dto.response.UserDto;
import com.goodee.coreconnect.user.entity.Status;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final S3Service s3Service; // ✅ 기존 S3Service 주입
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    // 프로필 이미지 업로드
    public void updateProfileImage(String email, MultipartFile file) throws IOException {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));

        // 1️⃣ S3에 업로드 → key 반환
        String key = s3Service.uploadProfileImage(file, user.getEmail());

        // 2️⃣ DB에 key 저장
        user.updateProfileImage(key);
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
    
    @Transactional
    public UserDto createUser(CreateUserReq req) {
        // 1) 중복 이메일 방지
        if (userRepository.existsByEmail(req.email())) {
            throw new IllegalArgumentException("이미 등록된 이메일입니다: " + req.email());
        }

        // 2) 부서 조회(선택)
        Department dept = null;
        if (req.deptId() != null) {
            dept = departmentRepository.findById(req.deptId())
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 부서 ID: " + req.deptId()));
        }

        // 3) 패스워드 해시
        String hash = passwordEncoder.encode(req.tempPassword());

        // 4) 유저 생성(정적 팩토리 사용)
        User user = User.createUser(
                hash,
                req.name(),
                req.role(),
                req.email(),
                req.phone(),
                dept
        );

        // (옵션) 기본 상태 보정
        if (user.getStatus() == null) {
            // createUser에서 ACTIVE로 넣고 있으므로 보통 필요 없음
            // user.activate() 같은 메서드가 있다면 호출
        }

        // 5) 저장 & 반환
        return UserDto.from(userRepository.save(user));
    }
    
    @Transactional
    public void changeStatus(Integer userId, Status status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저가 존재하지 않습니다: " + userId));
        if (status == Status.ACTIVE) {
            user.activate();
        } else if (status == Status.INACTIVE) {
            user.deactivate();
        }
    }
}
