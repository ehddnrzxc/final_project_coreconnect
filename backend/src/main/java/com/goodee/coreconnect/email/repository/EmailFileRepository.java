package com.goodee.coreconnect.email.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.email.entity.EmailFile;

public interface EmailFileRepository extends JpaRepository<EmailFile, Integer> {

}
