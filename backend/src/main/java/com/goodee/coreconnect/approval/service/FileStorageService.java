package com.goodee.coreconnect.approval.service;

import java.io.InputStream;

import com.goodee.coreconnect.approval.entity.File;

public interface FileStorageService {
  /**
   * 첨부파일 정보에 맞는 파일 InputStream을 반환
   * (S3, 로컬 등 스토리지에 따라 구현)
   */
  InputStream loadFileAsInputStream(File file);
}
