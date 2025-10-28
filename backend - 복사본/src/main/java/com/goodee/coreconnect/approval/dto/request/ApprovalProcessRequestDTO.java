package com.goodee.coreconnect.approval.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ApprovalProcessRequestDTO {

  /**
   * 결재 의견 (승인 시 생략 가능, 반려 시 필수 등)
   */
  private String approvalComment;
  
}
