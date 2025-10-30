package com.goodee.coreconnect.department.service;

import java.util.List;

import com.goodee.coreconnect.department.dto.response.DepartmentFlatDTO;
import com.goodee.coreconnect.department.dto.response.DepartmentTreeDTO;
import com.goodee.coreconnect.department.entity.Department;
import com.goodee.coreconnect.department.repository.DepartmentRepository;

public interface DepartmentService {
  
  /** 전체 조직도 트리 조회 */
  public List<DepartmentTreeDTO> getDepartmentTree();
  
  /** 부서 조회(평탄화) */
  public List<DepartmentFlatDTO> getDepartmentListFlat();
  
  /** 부서 단건 조회 */
  public Department get(Integer id);
  
  /** 부서 생성 */
  public Integer create(String name, Integer orderNo, Integer parentId);
  
  /** 부서 기본정보 변경 */
  public void updateBasic(Integer id, String newName, Integer newOrderNo);
  
  /** 부서 이동(상위부서 변경) */
  public void move(Integer id, Integer newParentId);
  
  /** 부서 삭제(자식/사원 존재 시 금지) */
  public void delete(Integer id);

}
