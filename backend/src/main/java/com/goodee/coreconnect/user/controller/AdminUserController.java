package com.goodee.coreconnect.user.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.user.dto.request.CreateUserReqDTO;
import com.goodee.coreconnect.user.dto.response.UserDTO;
import com.goodee.coreconnect.user.entity.Status;
import com.goodee.coreconnect.user.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {
  
  private final UserService userService;
  
  /**
   * [관리자] 신규 사용자 생성
   *
   * <p>요청 예시:
   * <pre>
   * POST /api/v1/admin/users
   * Content-Type: application/json
   *
   * {
   *   "email": "user@example.com",
   *   "name": "홍길동",
   *   "role": "USER"
   * }
   * </pre>
   *
   * @param req 신규 사용자 생성 요청 DTO
   * @return 생성된 사용자 정보를 담은 UserDTO
   */
  @PostMapping
  public UserDTO create(@Valid @RequestBody CreateUserReqDTO req) {
    return userService.createUser(req);
  }
  
  /**
   * [관리자] 사용자 상태 변경 (활성/비활성)
   *
   * <p>요청 예시:
   * <pre>
   * DELETE /api/v1/admin/users/61?status=INACTIVE
   * </pre>
   *
   * <p>지정된 사용자 ID의 상태를 ACTIVE 또는 INACTIVE로 변경합니다.
   * 회원 탈퇴, 계정 비활성화 등 관리용으로 사용됩니다.
   *
   * @param id 변경할 사용자 ID (PathVariable)
   * @param status 변경할 상태 (Query Parameter)
   */
  @DeleteMapping("/{id}")
  public void changeStatus(@PathVariable("id") Integer id, @RequestParam("status") Status status) {
    userService.changeStatus(id, status);
  }
  
  @GetMapping
  public List<UserDTO> findAllUsers() {
    return userService.findAllUsers();
  }
  
}
