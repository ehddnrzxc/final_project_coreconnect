package com.goodee.coreconnect.department.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.goodee.coreconnect.department.service.DepartmentService;

@Configuration
public class DepartmentSeeder {
  
  @Bean
  public CommandLineRunner initDepartments(DepartmentService departmentService) {
    return args -> {
      // 부서가 비어 있을 때만 실행
      if(departmentService.getDepartmentTree().isEmpty()) {
        // 최상위: 회사 또는 대표이사실
        Integer root = departmentService.create("코어커넥트 1.0", 10, null);
        
        // 대표: 대표이사 자리 역할
        Integer ceoOffice = departmentService.create("대표이사실", 20, root);
        
        // 1차 하위 부서들
        // create(부서이름, orderNo(같은 상위 부서 안에서의 정렬 순서), 상위부서)
        Integer mgmt = departmentService.create("경영", 10, ceoOffice);
        Integer collab = departmentService.create("협업팀", 20, ceoOffice); 
        Integer dev = departmentService.create("개발", 30, ceoOffice);
        Integer design = departmentService.create("디자인", 40, ceoOffice);
        Integer security = departmentService.create("전산/보안", 50, ceoOffice);
      }
      
      
    };
  }
}
