package com.goodee.coreconnect.department.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.department.dto.response.OrganizationTreeDTO;
import com.goodee.coreconnect.department.entity.Department;
import com.goodee.coreconnect.department.repository.DepartmentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrganizationServiceImpl implements OrganizationService {

    private final DepartmentRepository departmentRepository;

    @Override
    public List<OrganizationTreeDTO> getOrganizationTree() {
        List<Department> roots = departmentRepository.findByParentIsNullOrderByDeptOrderNoAsc(); // 최상위 부서(부모 없는 부서)를 순서대로 조회
       
        // 각 부서를 트리 구조 DTO로 변환
        return roots.stream()
                     .map(dept -> OrganizationTreeDTO.from(dept))
                     .collect(Collectors.toList());
    }
}
