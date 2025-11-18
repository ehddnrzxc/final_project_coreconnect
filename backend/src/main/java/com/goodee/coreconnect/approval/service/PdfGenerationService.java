package com.goodee.coreconnect.approval.service;

import java.io.IOException;

public interface PdfGenerationService {

  /**
   * 최종 완성된 HTML 문자열을 기반으로 PDF 파일(byte 배열)을 생성
   * @param htmlContent 데이터가 병합되고, 폰트 CSS가 포함된 '최종 완성 HTML'
   * @return PDf 파일을 byte 배열
   * @throws IOException PDF 렌더링 또는 I/O 중 오류 발생 시
   */
  byte[] generatePdfFromHtmlString(String htmlContent) throws IOException;
  
}
