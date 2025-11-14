package com.goodee.coreconnect.approval.dto.request;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class DocumentUpdateRequestDTO {
  
  /**
   * 문서 제목
   */
  @Size(max = 100, message = "제목을 100자를 초과할 수 없습니다.")
  private String documentTitle;
  
  /**
   * 문서 내용
   */
  private String documentDataJson;
  
  /**
   * 결재선에 포함될 (사용자 + 역할) 목록
   */
  @Valid
  private List<ApprovalLineRequestDTO> approvalLines;

}
