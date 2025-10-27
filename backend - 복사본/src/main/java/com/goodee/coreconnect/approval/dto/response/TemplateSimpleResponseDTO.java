package com.goodee.coreconnect.approval.dto.response;

import com.goodee.coreconnect.approval.entity.Template;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TemplateSimpleResponseDTO {

  private Integer templateId;
  private String templateName;
  
  public static TemplateSimpleResponseDTO toDTO(Template template) {
    return TemplateSimpleResponseDTO.builder()
        .templateId(template.getId())
        .templateName(template.getTemplateName())
        .build();
  }
  
}
