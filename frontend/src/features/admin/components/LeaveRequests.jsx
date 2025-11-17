import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import { getAdminLeaveRequests } from "../api/adminAPI";

export default function LeaveRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAdminLeaveRequests();
      setRequests(data);
      setErr("");
    } catch (e) {
      console.error(e);
      setErr("휴가 요청 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const renderStatusChip = (status) => {
    switch (status) {
      case "PENDING":
        return <Chip label="대기중" color="warning" size="small" />;
      case "APPROVED":
        return <Chip label="승인" color="success" size="small" />;
      case "REJECTED":
        return <Chip label="반려" color="error" size="small" />;
      case "CANCELED":
        return <Chip label="취소" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Box sx={{ px: 4, py: 3, maxWidth: 1440, mx: "auto" }}>
      {/* 헤더 */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <BeachAccessIcon color="primary" sx={{ fontSize: 30 }} />
        <Typography variant="h4" fontWeight={800} sx={{ fontSize: 28 }}>
          휴가 요청 현황
        </Typography>
      </Stack>

      <Card
        sx={{
          borderRadius: 3,
          boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          {err && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {err}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>신청자</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>이메일</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>기간</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>종류</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>사유</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      휴가 요청 내역이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => (
                    <TableRow key={req.leaveReqId} hover>
                      {/* 백엔드 DTO 필드명에 맞게 수정:
                         userName/userEmail 이면 거기에 맞춰 바꿔줘 */}
                      <TableCell>{req.username}</TableCell>
                      <TableCell>{req.email}</TableCell>
                      <TableCell>
                        {req.startDate} ~ {req.endDate}
                      </TableCell>
                      <TableCell>{req.type}</TableCell>
                      <TableCell>{req.reason}</TableCell>
                      <TableCell>{renderStatusChip(req.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
