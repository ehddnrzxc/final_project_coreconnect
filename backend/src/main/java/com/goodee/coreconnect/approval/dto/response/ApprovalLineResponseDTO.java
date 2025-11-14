package com.goodee.coreconnect.approval.dto.response;

import java.time.LocalDateTime;

import com.goodee.coreconnect.approval.entity.ApprovalLine;
import com.goodee.coreconnect.approval.enums.ApprovalLineStatus;
import com.goodee.coreconnect.user.entity.User;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ApprovalLineResponseDTO {

  private Integer lineId; // 결재선 고유 ID
  private int approvalOrder; // 결재 순서
  private ApprovalLineStatus approvalStatus; // 현재 상태
  private String approvalComment; // 결재 의견
  private LocalDateTime processedAt; // 처리 일시

  private UserInfoResponseDTO approver; // 결재자 정보
  private String name;
  private String positionName;
  private String deptName;
  
  private String approvalType;  // 결재 타입

  public static ApprovalLineResponseDTO toDTO(ApprovalLine line) {
    User approver = line.getApprover();
    String typeName = "";
    if (line.getApprovalLineType() != null) {
      typeName = line.getApprovalLineType().name();
    }
    return ApprovalLineResponseDTO.builder()
        .lineId(line.getId())
        .approvalOrder(line.getApprovalLineOrder())
        .approvalStatus(line.getApprovalLineStatus())
        .approvalComment(line.getApprovalLineComment())
        .processedAt(line.getApprovalLineProcessedAt())
        .name(approver.getName())
        .positionName(approver.getJobGrade().toString())
        .deptName(approver.getDepartment().getDeptName())
        .approver(UserInfoResponseDTO.toDTO(line.getApprover()))
        .approvalType(typeName)
        .build();
  }

}
