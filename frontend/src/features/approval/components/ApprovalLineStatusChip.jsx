import React from "react";
import { Chip } from "@mui/material";

/**
 * 결재 라인(결재선)의 개별 상태를 표시하는 칩
 * @param {string} status - 결재 상태 (e.g., WAITING, APPROVED, REJECTED)
 */
function ApprovalLineStatusChip({ status }) {
  let color = "default";
  let label = status; // 기본값은 영문

  switch (status) {
    case "APPROVED":
      color = "success";
      label = "승인";
      break;
    case "REJECTED":
      color = "error";
      label = "반려";
      break;
    case "WAITING":
      color = "primary";
      label = "대기";
      break;
    default:
      // 알 수 없는 상태는 그대로 표시
      label = status || "N/A";
  }

  return (
    <Chip
      label={label}
      color={color}
      size="small"
      variant="outlined"
      sx={{
        fontWeight: "bold",
        minWidth: "50px", 
      }}
    />
  );
}

export default ApprovalLineStatusChip;