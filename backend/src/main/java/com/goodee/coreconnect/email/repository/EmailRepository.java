package com.goodee.coreconnect.email.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.email.entity.Email;

public interface EmailRepository extends JpaRepository<Email, Integer> {

}
