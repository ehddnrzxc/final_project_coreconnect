package com.goodee.coreconnect.approval.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.approval.entity.Document;

public interface DocumentRepository extends JpaRepository<Document, Integer>{

}
