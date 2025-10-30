package com.goodee.coreconnect.approval.dto.request;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 임시저장용 DTO.
 * 결재선(approvalIds)이 null이거나 비어있어도 허용
 */
@Getter
@Setter
@NoArgsConstructor
public class DocumentDraftRequestDTO {

  /**
   * 사용할 템플릿 ID
   */
  @NotNull(message = "템플릿 ID는 필수입니다.")
  private Integer templateId;

  /**
   * 문서 제목
   */
  @Size(max = 100, message = "제목은 100자를 초과할 수 없습니다.")
  private String documentTitle;

  /**
   * 문서 내용
   */
  private String documentContent;

  /**
   * 결재선에 포함될 (사용자 + 역할) 목록 (순서대로) (임시저장은 비어있을 수 있음)
   */
  @Valid
  private List<ApprovalLineRequestDTO> approvalLines;

}