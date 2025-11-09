package com.goodee.coreconnect.email.service;

import java.io.InputStream;

import com.goodee.coreconnect.email.entity.EmailFile;

public interface EmailFileStorageService {
	/**
     * 첨부파일 정보에 맞는 파일 InputStream을 반환
     * (S3, 로컬 등 스토리지에 따라 구현)
     */
    InputStream loadFileAsInputStream(EmailFile file);
}
