import { Chip } from '@mui/material';

function ApprovalStatusChip({ status }) {
  let color = "default";
  let label = status;

  if (status === "COMPLETED") {
    color = "success";
    label = "승인";
  } else if (status === "REJECTED") {
    color = "error";
    label = "반려";
  } else if (status === "IN_PROGRESS") {
    color = "primary";
    label = "진행중";
  } else if (status === "DRAFT") {
    color = "warning";
    label = "임시저장";
  }
  return <Chip label={label} color={color} size="small" />;
}

export default ApprovalStatusChip;