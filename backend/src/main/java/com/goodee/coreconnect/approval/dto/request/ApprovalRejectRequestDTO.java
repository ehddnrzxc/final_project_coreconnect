package com.goodee.coreconnect.approval.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ApprovalRejectRequestDTO {

  /**
   * 결재 의견 (반려 시 필수)
   */
  @NotBlank(message = "반려 사유는 필수입니다.")
  @Size(max = 255, message = "결재 의견은 255자를 초과할 수 없습니다.")
  private String approvalComment;
  
}
