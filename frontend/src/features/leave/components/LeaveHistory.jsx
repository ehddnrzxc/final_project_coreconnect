import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
} from "@mui/material";
import { getMyLeaveRequests, getMyLeaveSummary } from "../api/leaveAPI";
import LeaveStatusChip from "./LeaveStatusChip";
import LeaveTypeChip from "./LeaveTypeChip";

/** 내 휴가내역 컴포넌트 */
export default function LeaveHistory() {
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0: 휴가현황, 1: 연차, 2: 기타휴가

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [leaveData, summaryData] = await Promise.all([
        getMyLeaveRequests(),
        getMyLeaveSummary(),
      ]);
      setLeaves(leaveData);
      setSummary(summaryData);
    } catch (e) {
      console.error("휴가 데이터 로딩 실패:", e);
    } finally {
      setLoading(false);
    }
  };

  // 탭에 따라 필터링된 휴가 목록
  const filteredLeaves = useMemo(() => {
    if (activeTab === 0) {
      // 휴가현황: 전체
      return leaves;
    } else if (activeTab === 1) {
      // 연차: type이 "ANNUAL"인 것만
      return leaves.filter((leave) => leave.type === "ANNUAL");
    } else {
      // 기타휴가: type이 "ANNUAL"이 아닌 것만
      return leaves.filter((leave) => leave.type !== "ANNUAL");
    }
  }, [leaves, activeTab]);

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
        휴가내역
      </Typography>

      {/* 탭 */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="휴가현황" />
          <Tab label="연차" />
          <Tab label="기타휴가" />
        </Tabs>
      </Box>

      {summary && (
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            p: 3,
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
        </Paper>
      )}

      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600 }}>시작일</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>종료일</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>종류</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>사유</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>결재 의견</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : filteredLeaves.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  휴가 내역이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredLeaves.map((item) => (
                <TableRow key={item.leaveReqId} hover>
                  <TableCell>{item.startDate}</TableCell>
                  <TableCell>{item.endDate}</TableCell>
                  <TableCell>
                    <LeaveTypeChip type={item.type} />
                  </TableCell>
                  <TableCell>{item.reason || "-"}</TableCell>
                  <TableCell>
                    <LeaveStatusChip status={item.status} />
                  </TableCell>
                  <TableCell>{item.approvalComment || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

