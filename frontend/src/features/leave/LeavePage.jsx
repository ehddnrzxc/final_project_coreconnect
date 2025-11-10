import React, { useState, useEffect } from "react";
import { Box,
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
import { getMyLeaveRequests } from "./api/leaveAPI";
import { getLeaveRequestLabel } from "../../components/utils/labelUtils";

export default function LeavePage() {

  const [leaves, setLeaves] = useState([]);

  // 휴가 목록 불러오기
  useEffect(() => {
    (async () => {
      try {
        const data = await getMyLeaveRequests();
        setLeaves(data);
      } catch (e) {
        console.error("휴가 내역을 불러오지 못했습니다:", e);
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
        휴가 신청은 전자결재를 통해 진행되며, 승인된 내역은 아래에서 확인할 수 있습니다.
      </Typography>

      {/* 전자결재 휴가양식으로 이동 */}
      <Button
        variant="contained"
        color="primary"
        sx={{ mb: 3 }}
        component={RouterLink}
        to="/e-approval/new/1"     // templateId=1을 '휴가양식'으로 사용
      >
        휴가 신청하기
      </Button>

      {/* 내 휴가 내역 테이블 (leave_request 조회) */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>시작일</TableCell>
            <TableCell>종료일</TableCell>
            <TableCell>종류</TableCell>
            <TableCell>사유</TableCell>
            <TableCell>상태</TableCell>
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
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Box>
  );
}
