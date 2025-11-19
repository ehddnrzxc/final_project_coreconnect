import React from "react";
import { Chip } from "@mui/material";

/**
 * 휴가 신청 상태를 표시하는 칩
 * @param {string} status - 휴가 상태 (PENDING, APPROVED, REJECTED, CANCELED)
 */
export default function LeaveStatusChip({ status }) {
  let color = "default";
  let label = status; 

  switch (status) {
    case "APPROVED":
      color = "success";
      label = "승인";
      break;
    case "REJECTED":
      color = "error";
      label = "반려";
      break;
    case "PENDING":
      color = "primary";
      label = "대기";
      break;
    case "CANCELED":
      color = "default";
      label = "취소";
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

