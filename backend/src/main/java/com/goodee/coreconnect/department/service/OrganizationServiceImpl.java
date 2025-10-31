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
        List<Department> roots = departmentRepository.findByParentIsNullOrderByDeptOrderNoAsc();
        return roots.stream()
                .map(OrganizationTreeDTO::from)
                .collect(Collectors.toList());
    }
}
