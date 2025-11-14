import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import { getMyLeaveRequests, getMyLeaveSummary } from "../api/leaveAPI";
import { getLeaveRequestLabel } from "../../../components/utils/labelUtils";

export default function LeavePage() {
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState(null);

  // 휴가 목록 불러오기
  useEffect(() => {
    (async () => {
      try {
        const [leaveData, summaryData] = await Promise.all([
          getMyLeaveRequests(),
          getMyLeaveSummary(),
        ]);
        setLeaves(leaveData);
        setSummary(summaryData);
      } catch (e) {
        console.error("휴가 데이터 로딩 실패:", e);
      }
    })();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <BeachAccessIcon sx={{ fontSize: 28, color: "primary.main" }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          휴가 관리
        </Typography>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        휴가 신청은 전자결재를 통해 진행되며, 승인된 내역은 아래에서 확인할 수
        있습니다.
      </Typography>

      {summary && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            display: "flex",
            gap: 4,
          }}
        >
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              부여 연차
            </Typography>
            <Typography variant="h6">
              {summary.totalAnnualLeaveDays}일
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              사용 연차
            </Typography>
            <Typography variant="h6">
              {summary.usedAnnualLeaveDays}일
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              남은 연차
            </Typography>
            <Typography variant="h6" color="primary.main">
              {summary.remainingAnnualLeaveDays}일
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              소진율
            </Typography>
            <Typography variant="h6">
              {summary.usedRate}
              <Typography component="span" variant="body2">
                %
              </Typography>
            </Typography>
          </Box>
        </Box>
      )}

      {/* 전자결재 휴가양식으로 이동 */}
      <Button
        variant="contained"
        color="primary"
        sx={{ mb: 3 }}
        component={RouterLink}
        to="/e-approval/new/1" // templateId=1을 '휴가양식'으로 사용
      >
        휴가 신청하기
      </Button>

      {/* 내 휴가 내역 테이블 (leave_request 조회) */}
      <Table
        sx={{
          "& .MuiTableCell-root": {
            borderColor: "divider",
          },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell>시작일</TableCell>
            <TableCell>종료일</TableCell>
            <TableCell>종류</TableCell>
            <TableCell>사유</TableCell>
            <TableCell>상태</TableCell>
            <TableCell>결재 의견</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {leaves.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center">
                휴가 내역이 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            leaves.map((item) => (
              <TableRow key={item.leaveReqId}>
                <TableCell>{item.startDate}</TableCell>
                <TableCell>{item.endDate}</TableCell>
                <TableCell>{item.type}</TableCell>
                <TableCell>{item.reason}</TableCell>
                <TableCell>{getLeaveRequestLabel(item.status)}</TableCell>
                <TableCell>{item.approvalComment || "-"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Box>
  );
}
