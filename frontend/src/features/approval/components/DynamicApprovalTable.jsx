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
  const actualApprovers = approvers;

  // 각 결재자의 직위, 이름, 서명/상태를 담을 배열
  const approverPositionCells = [];
  const approverNameCells = [];
  const approverSignatureCells = [];

  if (actualApprovers.length > 0) {
    actualApprovers.forEach((line) => {
      let userId, positionName, name, approvalStatus;

      if (line.approver) {
        // 상세 페이지 (DocumentDetailPage) 데이터 처리
        userId = line.approver.userId;
        positionName = getJobGradeLabel(line.approver.positionName); // 직급 번역 적용
        name = line.approver.userName;
        approvalStatus = line.approvalStatus; // 결재 상태
      } else {
        // 작성 페이지 (NewDocumentPage) 데이터 처리
        userId = line.userId;
        positionName = getJobGradeLabel(line.positionName); // 직급 번역 적용
        name = line.name;
        approvalStatus = ""; // 작성 페이지에서는 결재 상태 없음
      }

      // 각 결재자의 데이터 셀 생성
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
        sigContent = ""; // 대기 중일 때는 비워둠
      }
      approverSignatureCells.push(
        <TableCell key={`${userId}-sig`} sx={{ height: "60px" }}>
          {sigContent}
        </TableCell>
      );
    });
  } else {
    // 결재자가 없을 경우 빈 셀 생성
    approverPositionCells.push(
      <TableCell key="blank-pos" sx={{ width: 70, color: "#ccc" }}></TableCell>
    );
    approverNameCells.push(<TableCell key="blank-name"> </TableCell>);
    approverSignatureCells.push(
      <TableCell key="blank-sig" sx={{ height: "60px" }}></TableCell>
    );
  }

  // 결재자 수가 0일 때를 대비해 colSpan을 동적으로 계산
  const approverColSpan =
    actualApprovers.length > 0 ? actualApprovers.length : 1;

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
          {/* 첫 번째 행: 기안자 직위 / (결재 승인) 직위 */}
          <TableRow sx={{ backgroundColor: "#f9f9f9", height: "30px" }}>
            {/* 기안자 직위 (rowSpan 2 -> 기안자 이름까지 합치기 위해 3으로 변경) */}
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
            {/* 결재자들의 직위 칸들 */}
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
          {/* 두 번째 행: 기안자 이름 / (결재 승인) 이름 */}
          <TableRow sx={{ height: "30px" }}>
            <TableCell>{drafter?.userName || drafter?.name}</TableCell>
            {approverNameCells}
          </TableRow>
          {/* 세 번째 행: 기안자 상신 / (결재 승인) 서명 */}
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
