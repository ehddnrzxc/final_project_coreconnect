package com.goodee.coreconnect.department.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.department.entity.Department;

public interface DepartmentRepository extends JpaRepository<Department, Integer> {

}
