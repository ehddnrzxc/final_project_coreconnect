package com.goodee.coreconnect.department.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.goodee.coreconnect.department.entity.Department;

public interface DepartmentRepository extends JpaRepository<Department, Integer> {
  
  // 루트 부서(상위 부서 없음)부터 정렬
  List<Department> findByParentIsNullOrderByDeptOrderNoAsc();
  
  // 특정 부모의 자식목록 정렬
  List<Department> findByParentIdOrderByDeptOrderNoAsc(Integer parentId);
  
  // 트리 구성용: 전체를 parent -> order 순으로
  List<Department> findAllByOrderByParentIdAscDeptOrderNoAsc();
  
  // 삭제 전 검사용
  boolean existsByParentId(Integer parentId);
  
  /** @EntityGraph fetch join 처럼 연관된 엔티티를 한 번에 가져오게 하는 설정 */
  @EntityGraph(attributePaths = {"users"})
  Optional<Department> findWithUsersById(Integer id);
  
  /** 부서 이름으로 부서를 찾는 메소드 */
  Optional<Department> findByDeptName(String deptName);
  
  /** 부서 ID로 게시판 카테고리ID를 찾는 메소드 */
  @Query("select d.boardCategory.id from Department d where d.id = :deptId")
  Optional<Integer> findBoardCategoryIdByDeptId(@Param("deptId") Integer deptId);
  
  

}
