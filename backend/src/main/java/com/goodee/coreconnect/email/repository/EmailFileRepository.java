package com.goodee.coreconnect.email.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.email.entity.Email;
import com.goodee.coreconnect.email.entity.EmailFile;

public interface EmailFileRepository extends JpaRepository<EmailFile, Integer> {

	List<EmailFile> findByEmail(Email email);

}
