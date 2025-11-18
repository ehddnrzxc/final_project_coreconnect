package com.goodee.coreconnect.approval.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;

@Service
public class PdfGenerationServiceImpl implements PdfGenerationService {
  
  private final ResourceLoader resourceLoader;
  
  public PdfGenerationServiceImpl(ResourceLoader resourceLoader) {
    this.resourceLoader = resourceLoader;
  }

  @Override
  public byte[] generatePdfFromHtmlString(String htmlContent) throws IOException {
    
    String baseUrl;
    try {
      Resource resource = resourceLoader.getResource("classpath:");
      baseUrl = resource.getURL().toString();
    } catch (IOException e) {
      throw new IOException("Could not resolve classpath base URL", e);
    }
    
    try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
      
      PdfRendererBuilder builder = new PdfRendererBuilder();
      
      // 폰트 사용을 위한 Fast Mode 활성화
      builder.useFastMode();
      
      // HTML 내용과 리소스 기본 경로 설정
      builder.withHtmlContent(htmlContent, baseUrl);
      
      // PDF 생성 후 outputStream에 쓰기
      builder.toStream(outputStream);
      
      // PDf 렌더링
      builder.run();
      
      return outputStream.toByteArray();
      
    } catch (Exception e) {
      throw new IOException("PDF generation failed: " + e.getMessage(), e);
    }
    
  }

}
