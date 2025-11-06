package com.goodee.coreconnect.email.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.email.entity.EmailRecipient;

public interface EmailRecipientRepository extends JpaRepository<EmailRecipient, Integer> {

}
