package com.goodee.coreconnect.approval.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ApprovalApproveRequestDTO {

  /**
   * 결재 의견 (승인 시 생략 가능)
   */
  @Size(max = 255, message = "결재 의견은 255자를 초과할 수 없습니다.")
  private String approvalComment;
  
}
