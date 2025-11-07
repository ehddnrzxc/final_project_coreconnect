package com.goodee.coreconnect.approval.dto.request;

import java.util.List;

import com.goodee.coreconnect.approval.entity.Document;
import com.goodee.coreconnect.approval.entity.Template;
import com.goodee.coreconnect.user.entity.User;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class DocumentCreateRequestDTO {
  
  /**
   * 사용할 템플릿 ID
   */
  @NotNull(message = "템플릿 ID는 필수입니다.")
  private Integer templateId;
  
  /**
   * 문서 제목
   */
  @NotBlank(message = "문서 제목은 필수입니다.") // null, "", " " 모두 허용 안 함
  @Size(max = 100, message = "제목은 100자를 초과할 수 없습니다.")
  private String documentTitle;
  
  /**
   * 문서 내용
   */
  @NotBlank(message = "문서 내용은 필수입니다.")
  private String documentDataJson;
  
  /**
   * 결재선에 포함될 (사용자 + 역할) 목록 (순서대로)
   */
  @Valid
  @NotEmpty(message = "결재선은 최소 1명 이상 지정해야 합니다.")
  private List<ApprovalLineRequestDTO> approvalLines;

//  /**
//   * 첨부 파일
//   */
//  private List<MultipartFile> files;
  
  public Document toEntity(Template template, User user) {
    return Document.createDocument(template, user, this.documentTitle, this.documentDataJson);
  }
  
}
