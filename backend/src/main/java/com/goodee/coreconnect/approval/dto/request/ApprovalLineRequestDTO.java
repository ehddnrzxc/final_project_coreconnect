package com.goodee.coreconnect.approval.dto.request;

import com.goodee.coreconnect.approval.enums.ApprovalLineType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 결재선 항목(사용자 ID + 역할 타입)을 담는 DTO
 */
@Getter
@Setter
@NoArgsConstructor
public class ApprovalLineRequestDTO {

  @NotNull(message = "결재자 ID는 필수입니다.")
  private Integer userId;

  @NotNull(message = "결재자 역할(결재/합의/참조)은 필수입니다.")
  private ApprovalLineType type;
}