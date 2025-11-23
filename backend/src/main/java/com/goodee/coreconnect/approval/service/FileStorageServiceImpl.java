package com.goodee.coreconnect.approval.service;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;

import org.springframework.stereotype.Service;

import com.goodee.coreconnect.approval.entity.File;

@Service
public class FileStorageServiceImpl implements FileStorageService{
  @Override
  public InputStream loadFileAsInputStream(File file) {
    String fileUrl = file.getFileUrl(); // S3 URL
    try {
      URL url = new URL(fileUrl);
      URLConnection conn = url.openConnection();
      return conn.getInputStream();
    } catch (IOException e) {
      throw new RuntimeException("파일을 읽을 수 없습니다: " + fileUrl, e);
    }
  }
}
