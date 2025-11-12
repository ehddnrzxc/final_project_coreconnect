import {
  Paper,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableBody,
} from "@mui/material";
import React from "react";

import { getJobGradeLabel } from "../../../components/utils/labelUtils";

const DynamicApprovalTable = ({ approvers = [], drafter }) => {
  // "REFER" 타입을 거르기 위한 필터
  const actualApprovers = approvers.filter(
    (line) => line.approvalType !== "REFER"
  );

  const approverPositionCells = [];
  const approverNameCells = [];
  const approverSignatureCells = [];

  if (actualApprovers.length > 0) {
    actualApprovers.forEach((line) => {
      let userId, positionName, name, approvalStatus;

      if (line.approver) {
        // 'approver' 객체가 있는 경우 (결재, 합의 등)
        userId = line.approver.userId;
        positionName = getJobGradeLabel(line.approver.positionName);
        name = line.approver.userName;
        approvalStatus = line.approvalStatus;
      } else {
        // 'approver' 객체가 없는 경우
        userId = line.userId;
        positionName = getJobGradeLabel(line.positionName);
        name = line.name;
        approvalStatus = line.approvalStatus || "";
      }

      approverPositionCells.push(
        <TableCell key={`${userId}-pos`} sx={{ width: 70 }}>
          {positionName}
        </TableCell>
      );
      approverNameCells.push(
        <TableCell key={`${userId}-name`}>{name}</TableCell>
      );

      let sigContent = "";
      if (approvalStatus === "APPROVED") {
        sigContent = "승인";
      } else if (approvalStatus === "REJECTED") {
        sigContent = "반려";
      } else if (approvalStatus === "WAITING") {
        sigContent = "";
      }
      approverSignatureCells.push(
        <TableCell key={`${userId}-sig`} sx={{ height: "60px" }}>
          {sigContent}
        </TableCell>
      );
    });
  } else {
    approverPositionCells.push(
      <TableCell key="blank-pos" sx={{ width: 70, color: "#ccc" }}></TableCell>
    );
    approverNameCells.push(<TableCell key="blank-name"> </TableCell>);
    approverSignatureCells.push(
      <TableCell key="blank-sig" sx={{ height: "60px" }}></TableCell>
    );
  }

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ width: "auto", maxWidth: "100%" }}
    >
      <Table
        size="small"
        sx={{
          borderCollapse: "collapse",
          "& td, & th": {
            border: "1px solid #ccc",
            textAlign: "center",
            p: 0,
            fontSize: "0.8rem",
          },
        }}
      >
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f9f9f9", height: "30px" }}>
            <TableCell
              rowSpan={3}
              sx={{
                width: 20,
                writingMode: "vertical-rl",
                backgroundColor: "#f2f2f2",
              }}
            >
              신청
            </TableCell>
            <TableCell sx={{ width: 70 }}>
              {getJobGradeLabel(drafter?.positionName) || "기안자"}
            </TableCell>
            <TableCell
              rowSpan={3}
              sx={{
                width: 20,
                writingMode: "vertical-rl",
                backgroundColor: "#f2f2f2",
              }}
            >
              승인
            </TableCell>
            {approverPositionCells}
          </TableRow>
          <TableRow sx={{ height: "30px" }}>
            <TableCell>{drafter?.userName || drafter?.name}</TableCell>
            {approverNameCells}
          </TableRow>
          <TableRow sx={{ height: "60px" }}>
            <TableCell>상신</TableCell>
            {approverSignatureCells}
          </TableRow>
        </TableHead>
      </Table>
    </TableContainer>
  );
};

export default DynamicApprovalTable;