package com.goodee.coreconnect.approval.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TemplateUpdateRequestDTO {

  @NotBlank(message = "양식 이름은 필수입니다.")
  private String templateName;

  @NotBlank(message = "양식 내용은 필수입니다.")
  private String templateContent;
  
}
