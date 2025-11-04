package com.goodee.coreconnect.approval.dto.request;

import com.goodee.coreconnect.approval.entity.Template;
import com.goodee.coreconnect.user.entity.User;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TemplateRequestDTO {

  @NotBlank(message = "양식 이름은 필수입니다.")
  private String templateName;
  
  private String templateContent;
  
  @NotBlank(message = "양식 키는 필수입니다. (예: VACATION)")
  private String templateKey;
  
  public Template toEntity(User admin) {
    return Template.createTemplate(this.templateName, this.templateContent, this.templateKey, admin);
  }
  
}
