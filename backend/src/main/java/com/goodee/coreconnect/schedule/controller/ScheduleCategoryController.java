package com.goodee.coreconnect.schedule.controller;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.schedule.dto.request.RequestScheduleCategoryDTO;
import com.goodee.coreconnect.schedule.dto.response.ResponseScheduleCategoryDTO;
import com.goodee.coreconnect.schedule.service.ScheduleCategoryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/scheduleCategories")
public class ScheduleCategoryController {

  private final ScheduleCategoryService scheduleCategoryService;

  /** 카테고리 생성 */
  @PostMapping
  public ResponseScheduleCategoryDTO create(@Valid @RequestBody RequestScheduleCategoryDTO dto, @AuthenticationPrincipal String email) {
    return scheduleCategoryService.createCategory(dto, email);
  }

  /** 카테고리 수정 */
  @PutMapping("/{id}")
  public ResponseScheduleCategoryDTO update(@PathVariable("id") Integer id,
                                            @Valid @RequestBody RequestScheduleCategoryDTO dto) {
    return scheduleCategoryService.updateCategory(id, dto);
  }

  /** 카테고리 삭제 */
  @DeleteMapping("/{id}")
  public void delete(@PathVariable("id") Integer id) {
    scheduleCategoryService.deleteCategory(id);
  }

  /** 특정 유저의 카테고리 목록 조회 */
  @GetMapping
  public List<ResponseScheduleCategoryDTO> getUserCategories(@AuthenticationPrincipal String email) {
    return scheduleCategoryService.getUserCategories(email);
  }
  
//  /** 특정 유저의 카테고리 목록 조회 (관리자) */
//  @GetMapping(params = "userId")
//  public List<ResponseScheduleCategoryDTO> getUserCategories(@RequestParam("userId") Integer userId) {
//    return scheduleCategoryService.getUserCategories(email);
//  }
  
}

