package com.goodee.coreconnect.approval.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.goodee.coreconnect.approval.entity.Template;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TemplateDetailResponseDTO {

  private Integer templateId;
  private String templateName;
  @JsonProperty("temp_key")
  private String tempKey;
  @JsonProperty("templateHtmlContent")
  private String templateHtmlContent;  // HTML 양식 내용
  
  public static TemplateDetailResponseDTO toDTO(Template template) {
    return TemplateDetailResponseDTO.builder()
        .templateId(template.getId())
        .templateName(template.getTemplateName())
        .tempKey(template.getTemplateKey())
        .templateHtmlContent(template.getTemplateHtmlContent())
        .build();
  }
  
}
