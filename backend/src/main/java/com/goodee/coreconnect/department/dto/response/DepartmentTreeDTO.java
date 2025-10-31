package com.goodee.coreconnect.department.dto.response;

import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/** 트리 구조(children)으로 생성 후 하위 노드를 추가해야 하는 구조이기 때문에 
 * record가 아니라 class를 사용함. */

@Getter
@Builder
@AllArgsConstructor
public class DepartmentTreeDTO {
  
  private Integer id;
  private String name;
  private Integer orderNo;
  private Integer userCount; // 부서별 인원수 보여줄 때
  private List<DepartmentTreeDTO> children;
  
  /** 정적 팩토리 메소드 */
  public static DepartmentTreeDTO createDepartmentTreeDTO(Integer id,
                                     String name, 
                                     Integer orderNo, 
                                     Integer userCount) {
    return DepartmentTreeDTO.builder()
             .id(id)
             .name(name)
             .orderNo(orderNo)
             .userCount(userCount)
             .children(new ArrayList<>())
             .build();
  }

}

