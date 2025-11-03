package com.goodee.coreconnect.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import software.amazon.awssdk.services.s3.S3Client;

/**
 * S3Config: AWS S3와 연동하기 위한 설정 클래스
 * S3Client 객체를 Bean으로 등록하여 애플리케이션 전역에서 주입받아 사용할 수 있게 한다. 
 */
@Configuration
public class S3Config {
	@Bean
	public S3Client s3Client() {
		return S3Client.create();
	}
}
