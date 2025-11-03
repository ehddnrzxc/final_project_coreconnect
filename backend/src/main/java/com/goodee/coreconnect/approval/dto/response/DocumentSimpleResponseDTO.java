package com.goodee.coreconnect.approval.dto.response;

import java.time.LocalDateTime;

import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.approval.enums.DocumentStatus;

import lombok.Builder;
import lombok.Getter;

/**
 * 문서 목록 조회 시 사용될 DTO ("내가 상신한 문서", "결재할 문서" 등 목록을 조회할 때 사용하는 가벼운 DTO)
 */
@Getter
@Builder
public class DocumentSimpleResponseDTO {

  private Integer documentId;
  private String documentTitle;
  private String writerName;
  private DocumentStatus documentStatus;
  private LocalDateTime createdAt;
  private String templateName;
  
  public static DocumentSimpleResponseDTO toDTO(Document document) {
    return DocumentSimpleResponseDTO.builder()
        .documentId(document.getId())
        .documentTitle(document.getDocumentTitle())
        .writerName(document.getUser().getName())
        .documentStatus(document.getDocumentStatus())
        .createdAt(document.getCreatedAt())
        .templateName(document.getTemplate().getTemplateName())
        .build();
  }
  
}
