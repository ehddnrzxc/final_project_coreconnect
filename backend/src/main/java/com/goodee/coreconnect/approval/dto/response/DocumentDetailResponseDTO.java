package com.goodee.coreconnect.approval.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.approval.enums.DocumentStatus;

import lombok.Builder;
import lombok.Getter;

/**
 * 문서 상세 조회 시 사용될 DTO (문서 상세 조회 시 사용하는 무거운 DTO)
 */
@Getter
@Builder
public class DocumentDetailResponseDTO {

  private Integer documentId;
  private String documentTitle;
  private String documentContent;
  private DocumentStatus documentStatus;
  private LocalDateTime createdAt;
  private LocalDateTime completedAt;
  private UserInfoResponseDTO drafter;
  private String templateName;
  private String tempHtmlContent;
  private List<ApprovalLineResponseDTO> approvalLines;
  private List<FileResponseDTO> files;
  
  public static DocumentDetailResponseDTO toDTO(Document document) {
    return DocumentDetailResponseDTO.builder()
        .documentId(document.getId())
        .documentTitle(document.getDocumentTitle())
        .documentContent(document.getDocumentDataJson())
        .documentStatus(document.getDocumentStatus())
        .createdAt(document.getCreatedAt())
        .completedAt(document.getCompletedAt())
        .drafter(UserInfoResponseDTO.toDTO(document.getUser()))
        .templateName(document.getTemplate().getTemplateName())
        .tempHtmlContent(document.getTemplate().getTemplateHtmlContent())
        .approvalLines(
            document.getApprovalLines().stream()
              .map(ApprovalLineResponseDTO::toDTO)
              .collect(Collectors.toList())
        )
        .files(
            document.getFiles().stream()
              .map(FileResponseDTO::toDTO)
              .collect(Collectors.toList())
        )
        .build();
  }
  
}
