package com.goodee.coreconnect.email.service;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;

import org.springframework.stereotype.Service;

import com.goodee.coreconnect.email.entity.EmailFile;

@Service
public class EmailFileStorageServiceImpl implements EmailFileStorageService {

	@Override
    public InputStream loadFileAsInputStream(EmailFile file) {
        String fileUrl = file.getEmailFileS3ObjectKey(); // S3 URL
        try {
            URL url = new URL(fileUrl);
            URLConnection conn = url.openConnection();
            return conn.getInputStream();
        } catch (IOException e) {
            throw new RuntimeException("파일을 읽을 수 없습니다: " + fileUrl, e);
        }
    }

}
