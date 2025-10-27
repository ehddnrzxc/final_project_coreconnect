package com.goodee.coreconnect.approval.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.approval.entity.ApprovalLine;

public interface ApprovalLineRepository extends JpaRepository<ApprovalLine, Integer>{

}
