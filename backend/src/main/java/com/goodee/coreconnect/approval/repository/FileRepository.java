package com.goodee.coreconnect.approval.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.approval.entity.File;

public interface FileRepository extends JpaRepository<File, Integer>{

}
