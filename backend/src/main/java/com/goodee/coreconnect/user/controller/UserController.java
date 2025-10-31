package com.goodee.coreconnect.user.controller;

import java.io.IOException;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.user.dto.request.ChangeUserDepartmentDTO;
import com.goodee.coreconnect.user.dto.request.ChangeUserJobGradeDTO;
import com.goodee.coreconnect.user.entity.Role;
import com.goodee.coreconnect.user.service.UserServiceImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/user")
@Slf4j
public class UserController {

    private final UserServiceImpl userService;

    /** 프로필 이미지 업로드 */
    @PostMapping("/profile-image")
    public ResponseEntity<String> uploadProfileImage(
            @AuthenticationPrincipal String email, 
            @RequestParam("file") MultipartFile file) throws IOException {
    
        userService.updateProfileImage(email, file);
        return ResponseEntity.ok("프로필 이미지 업로드 성공");
    }

    /**  프로필 이미지 조회 */
    @GetMapping("/profile-image")
    public ResponseEntity<Map<String, String>> getProfileImageUrl(
            @AuthenticationPrincipal String email) {

        String imageUrl = userService.getProfileImageUrlByEmail(email);
        return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
    }
    
    /** 사용자의 소속 부서 변경 */
    @PutMapping("/{id}/department") 
    ResponseEntity<Void> changeUserDeptartment(@PathVariable("id") Integer id, 
                                               @RequestBody ChangeUserDepartmentDTO req) {
      userService.moveUserToDepartment(id, req.deptId());
      return ResponseEntity.noContent().build();
    }
    
    /** 사용자의 직급 변경 */
    @PutMapping("/{id}/job-grade")
    ResponseEntity<Void> changeUserJobGrade(@PathVariable("id") Integer id,
                                            @RequestBody ChangeUserJobGradeDTO req) {
      userService.moveUserToJobGrade(id, req.jobGrade());
      return ResponseEntity.noContent().build();
    }
    
    /** 사용자의 권한(Role) 변경 */
    @PutMapping("/{id}/role")
    public ResponseEntity<Void> changeUserRole(@PathVariable("id") Integer id,
                                               @RequestBody Map<String, String> body) {
        String newRoleStr = body.get("role");
        if (newRoleStr == null) {
            throw new IllegalArgumentException("role 값이 필요합니다.");
        }

        Role newRole = Role.valueOf(newRoleStr.toUpperCase());
        userService.moveUserToRole(id, newRole);
        return ResponseEntity.noContent().build();
    }
}
