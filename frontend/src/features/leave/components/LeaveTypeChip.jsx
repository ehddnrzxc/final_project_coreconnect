import React from "react";
import { Chip } from "@mui/material";
import { getLeaveTypeLabel } from "../../../components/utils/labelUtils";

/**
 * 휴가 유형을 표시하는 칩
 * @param {string} type - 휴가 유형 enum (ANNUAL, HALF_DAY_MORNING, HALF_DAY_AFTERNOON, SICK, FAMILY_EVENT, ETC)
 */
function LeaveTypeChip({ type, ...props }) {
  const getTypeColor = (type) => {
    switch (type) {
      case "ANNUAL":
        return "primary";
      case "HALF_DAY_MORNING":
      case "HALF_DAY_AFTERNOON":
        return "info";
      case "SICK":
        return "warning";
      case "FAMILY_EVENT":
        return "success";
      case "ETC":
        return "default";
      default:
        return "default";
    }
  };

  const label = getLeaveTypeLabel(type);
  const color = getTypeColor(type);

  return (
    <Chip
      label={label}
      color={color}
      size="small"
      variant="outlined"
      sx={{
        fontWeight: "bold",
      }}
      {...props}
    />
  );
}

export default LeaveTypeChip;

