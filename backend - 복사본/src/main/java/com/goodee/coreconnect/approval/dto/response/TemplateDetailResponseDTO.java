package com.goodee.coreconnect.approval.dto.response;

import com.goodee.coreconnect.approval.entity.Template;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TemplateDetailResponseDTO {

  private Integer templateId;
  private String templateName;
  private String templateContent;  // HTML 양식 내용
  
  public static TemplateDetailResponseDTO toDTO(Template template) {
    return TemplateDetailResponseDTO.builder()
        .templateId(template.getId())
        .templateName(template.getTemplateName())
        .templateContent(template.getTemplateContent())
        .build();
  }
  
}
