package com.goodee.coreconnect.department.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.goodee.coreconnect.department.dto.request.CreateRequestDTO;
import com.goodee.coreconnect.department.dto.request.MoveRequestDTO;
import com.goodee.coreconnect.department.dto.request.UpdateRequestDTO;
import com.goodee.coreconnect.department.dto.response.DepartmentFlatDTO;
import com.goodee.coreconnect.department.dto.response.DepartmentTreeDTO;
import com.goodee.coreconnect.department.service.DepartmentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
public class DepartmentController {
  
  private final DepartmentService departmentService;
  
  // 부서 조회(트리 형식)
  @GetMapping("/tree")
  public ResponseEntity<List<DepartmentTreeDTO>> getTree() {
    return ResponseEntity.ok(departmentService.getDepartmentTree());
  }
  
  // 부서 조회(평탄화 방식)
  @GetMapping("/flat")
  public ResponseEntity<List<DepartmentFlatDTO>> getDepartmentsFlat() {
      return ResponseEntity.ok(departmentService.getDepartmentListFlat());
  }
  
  // 생성
  @PostMapping
  public ResponseEntity<Integer> create(@RequestBody CreateRequestDTO req) {
    Integer id = departmentService.create(req.name(), req.orderNo(), req.parentId());
    return ResponseEntity.ok(id);
  }
  
  // 기본정보 수정(이름/정렬)
  @PutMapping("/{id}")
  public ResponseEntity<Void> update(@PathVariable Integer id, @RequestBody UpdateRequestDTO req) {
    departmentService.updateBasic(id, req.name(), req.OrderNo());
    return ResponseEntity.noContent().build(); // 요청은 성공했지만 리턴할 본문은 없음.
  }
  
  // 이동(상위부서 변경)
  @PutMapping("/{id}/move")
  public ResponseEntity<Void> move(@PathVariable Integer id, @RequestBody MoveRequestDTO req) {
    departmentService.move(id, req.parentId());
    return ResponseEntity.noContent().build();
  }
  
  // 삭제
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Integer id) {
    departmentService.delete(id);
    return ResponseEntity.noContent().build();
  }
}
