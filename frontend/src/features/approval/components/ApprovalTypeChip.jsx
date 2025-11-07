import { Chip } from '@mui/material';
import React from 'react';

const typeChipStyle = type => {
  switch (type) {
    case "APPROVE":
      return { backgroundColor: "#d0ebff", color: "#00529B", fontWeight: 'bold' };
    case "AGREE":
      return { backgroundColor: "#d1f7c4", color: "#1e4620", fontWeight: 'bold' };
    case "REFER":
      return { backgroundColor: "#fde8d7", color: "#6e3f1a", fontWeight: 'bold' };
    default:
      return {};
  }
};

const getTypeName = type => {
  switch (type) {
    case "APPROVE": return "결재";
    case "AGREE": return "합의";
    case "REFER": return "참조";
    default: return type;
  }
};

function ApprovalTypeChip({ type, ...props }) {
  return (
    <Chip
      label={getTypeName(type)}
      sx={typeChipStyle(type)}
      {...props}
    />
  );
}

export default ApprovalTypeChip;