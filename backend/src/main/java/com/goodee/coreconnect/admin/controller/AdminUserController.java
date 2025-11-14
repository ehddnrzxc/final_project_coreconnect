package com.goodee.coreconnect.admin.controller;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.admin.dto.request.CreateUserReqDTO;
import com.goodee.coreconnect.admin.dto.request.ChangeUserDepartmentDTO;
import com.goodee.coreconnect.admin.dto.request.ChangeUserJobGradeDTO;
import com.goodee.coreconnect.admin.dto.request.RejectLeaveRequestDTO;
import com.goodee.coreconnect.admin.dto.request.UpdateUserReqDTO;
import com.goodee.coreconnect.admin.service.AdminUserService;
import com.goodee.coreconnect.department.service.DepartmentService;
import com.goodee.coreconnect.security.userdetails.CustomUserDetails;
import com.goodee.coreconnect.user.dto.response.PasswordResetResponseDTO;
import com.goodee.coreconnect.user.dto.response.TempPasswordResponseDTO;
import com.goodee.coreconnect.user.dto.response.UserDTO;
import com.goodee.coreconnect.user.entity.JobGrade;
import com.goodee.coreconnect.user.entity.Role;
import com.goodee.coreconnect.user.entity.Status;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.service.PasswordResetService;
import com.goodee.coreconnect.user.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class AdminUserController {
  
  private final AdminUserService adminUserService;
  private final UserService userService;
  private final DepartmentService departmentService;
  private final PasswordResetService passwordResetService;
  
  /** 신규 사용자 생성 */
  @PostMapping
  public UserDTO create(@Valid @RequestBody CreateUserReqDTO req) {
    return adminUserService.createUser(req);
  }
  
  /** 사용자 정보 수정 */
  @PutMapping("/{id}")
  public ResponseEntity<UserDTO> update(
      @PathVariable(name = "id") Integer id,
      @RequestBody UpdateUserReqDTO req
  ) {
    UserDTO updated = adminUserService.updateUser(id, req);
    return ResponseEntity.ok(updated);
  }

  /** 유저의 부서 변경 메소드 */
  @PutMapping("/{id}/department")
  public ResponseEntity<Void> changeUserDepartment(
      @PathVariable("id") Integer id,
      @RequestBody ChangeUserDepartmentDTO req
  ) {
    adminUserService.changeUserDepartment(id, req.deptId());
    return ResponseEntity.noContent().build();
  }

  /** 유저의 직급 변경 메소드 */
  @PutMapping("/{id}/job-grade")
  public ResponseEntity<Void> changeUserJobGrade(
      @PathVariable("id") Integer id,
      @Valid @RequestBody ChangeUserJobGradeDTO req
  ) {
    adminUserService.changeUserJobGrade(id, req.jobGrade());
    return ResponseEntity.noContent().build();
  }

  /** 사용자의 권한(Role) 변경 */
  @PutMapping("/{id}/role")
  public ResponseEntity<Void> changeUserRole(
      @PathVariable("id") Integer id,
      @RequestBody Map<String, String> body
  ) {
    String newRoleStr = body.get("role");
    if (newRoleStr == null) {
      throw new IllegalArgumentException("role 값이 필요합니다.");
    }

    Role newRole = Role.valueOf(newRoleStr.toUpperCase());
    adminUserService.changeUserRole(id, newRole);
    return ResponseEntity.noContent().build();
  }
 
  /** 사용자 상태 변경 (활성/비활성) */
  @DeleteMapping("/{id}")
  public void changeStatus(@PathVariable("id") Integer id, @RequestParam("status") Status status) {
    adminUserService.changeStatus(id, status);
  }
  
  /** 각종 통계를 제공해주는 메소드 */
  @GetMapping("/stats")
  public Map<String, Long> getAllStats() {
    Map<String, Long> stats = new HashMap<>();
    stats.put("totalUsers", adminUserService.getAllUserCount());
    stats.put("activeUsers", adminUserService.getAllActiveUserCount());
    stats.put("departments", departmentService.getAllDepartmentCount());
    return stats;
  }
  
  /** 사용 가능한 Role 목록 조회(서비스X) */
  @GetMapping("/roles")
  public List<String> getRoles() {
    return Arrays.stream(Role.values())
                 .map(Enum::name)
                 .collect(Collectors.toList());
  }
  
  /** 사용 가능한 직급 목록 조회(서비스X) */
  @GetMapping("/job-grades")
  public List<Map<String, String>> getJobGrades() {
    return Arrays.stream(JobGrade.values())
                 .map(grade -> Map.of(
                       "value", grade.name(),
                       "label", grade.label()
                     ))
                 .collect(Collectors.toList());
  }
  
  /** 비밀번호 변경 요청 조회 */
  @GetMapping("/password-reset/requests")
  public List<PasswordResetResponseDTO> getRequest(@RequestParam(name = "status", required = false) String status) {
    log.info("password-reset: {}", passwordResetService.getRequests(status));
    return passwordResetService.getRequests(status);
  }
  
  /** 비밀번호 변경 요청 승인 */
  @PutMapping("/password-reset/requests/{id}/approve")
  public ResponseEntity<TempPasswordResponseDTO> approve(@PathVariable(name = "id") Long id,
                                                         @AuthenticationPrincipal CustomUserDetails customUserDetails) {
    String email = customUserDetails.getEmail();
    User user = userService.getUserByEmail(email);
    passwordResetService.approve(id, user);
    return ResponseEntity.noContent().build();
  }
  
  /** 비밀번호 변경 요청 거절 */
  @PutMapping("/password-reset/requests/{id}/reject")
  public ResponseEntity<TempPasswordResponseDTO> reject(
      @PathVariable(name = "id") Long id,
      @AuthenticationPrincipal CustomUserDetails customUserDetails,
      @RequestBody RejectLeaveRequestDTO rejectReason
  ) {
      String email = customUserDetails.getEmail();
      User user = userService.getUserByEmail(email);
      passwordResetService.reject(id, user, rejectReason);
      return ResponseEntity.noContent().build();
  }
  
}
