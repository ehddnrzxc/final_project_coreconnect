package com.goodee.coreconnect.user.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.user.dto.request.CreateUserReq;
import com.goodee.coreconnect.user.dto.response.UserDto;
import com.goodee.coreconnect.user.entity.Status;
import com.goodee.coreconnect.user.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // 이 컨트롤러 전체를 ADMIN 전용으로 
public class AdminUserController {
  
  private final UserService userService;
  
  @PostMapping
  public UserDto create(@Valid @RequestBody CreateUserReq req) {
    return userService.createUser(req);
  }
  
  @PutMapping("/{id}")
  public void changeStatus(@PathVariable Integer id, @RequestParam Status status) {
    userService.changeStatus(id, status);
  }
  
  

}
