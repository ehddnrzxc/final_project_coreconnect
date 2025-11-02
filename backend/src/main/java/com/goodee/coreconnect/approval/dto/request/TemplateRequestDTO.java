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
  
  @NotBlank(message = "양식 내용은 필수입니다.")
  private String templateContent;
  
  public Template toEntity(User user) {
    return Template.createTemplate(this.templateName, this.templateContent, user);
  }
  
}
