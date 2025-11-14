package com.goodee.coreconnect.user.controller;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.security.userdetails.CustomUserDetails;
import com.goodee.coreconnect.user.dto.response.OrganizationUserResponseDTO;
import com.goodee.coreconnect.user.dto.response.UserDTO;
import com.goodee.coreconnect.user.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/user")
@Slf4j
public class UserController {

    private final UserService userService;

    /** 프로필 이미지 업로드 */
    @PostMapping("/profile-image")
    public ResponseEntity<String> uploadProfileImage(
            @AuthenticationPrincipal CustomUserDetails user, 
            @RequestParam("file") MultipartFile file) throws IOException {
        
        String email = user.getEmail();
        userService.updateProfileImage(email, file);
        return ResponseEntity.ok("프로필 이미지 업로드 성공");
    }

    /** 프로필 이미지 조회 */
    @GetMapping("/profile-image")
    public ResponseEntity<Map<String, String>> getProfileImageUrl(
            @AuthenticationPrincipal CustomUserDetails user) {
        
        String email = user.getEmail();
        String imageUrl = userService.getProfileImageUrlByEmail(email);
        return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
    }
    
    /** 조직도 전체 사용자 목록 조회 */
    @GetMapping("/organization")
    public ResponseEntity<List<OrganizationUserResponseDTO>> getOrganizationChart() {
      List<OrganizationUserResponseDTO> userList = userService.getOrganizationChart();
      return ResponseEntity.ok(userList);
    }
    
    /** 사용자 목록 조회 */
    @GetMapping
    public List<UserDTO> findAllUsers() {
      return userService.findAllUsers();
    }
    
    /** 사용자 로그인 정보로부터 사용자의 정보를 가져오는 API */
    @GetMapping("/profile-info")
    public ResponseEntity<UserDTO> getCurrentUser(
      @AuthenticationPrincipal CustomUserDetails user    
    ) {
      String email = user.getEmail();
      UserDTO dto = userService.getProfile(email);
      return ResponseEntity.ok(dto);
    }
    
    
}
