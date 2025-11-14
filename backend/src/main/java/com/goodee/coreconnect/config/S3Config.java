package com.goodee.coreconnect.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import software.amazon.awssdk.auth.credentials.EnvironmentVariableCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner; 

/**
 * S3Config: AWS S3와 연동하기 위한 설정 클래스
 * S3Client, S3Presigner 객체를 Bean으로 등록하여
 * 애플리케이션 전역에서 주입받아 사용할 수 있게 한다.
 */
@Configuration
public class S3Config {
    @Bean
    public S3Client s3Client() {
        return S3Client.create();
    }

    // Presigned URL 생성을 위함
    @Bean
    public S3Presigner s3Presigner() {
        return S3Presigner.builder()
                           .region(Region.AP_NORTHEAST_2) // 서울 리전
                           .credentialsProvider(EnvironmentVariableCredentialsProvider.create())
                           .build();
    }
}
