import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Chip,
  Stack,
  CircularProgress,
} from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";

import {
  getPasswordResetRequests,
  approvePasswordResetRequest,
  rejectPasswordResetRequest
} from "../api/adminAPI";

export default function PasswordResetPage() {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("PENDING"); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState(null); // 진행 중인 행 ID


  const loadRequests = async (status) => {
    setLoading(true);
    setError("");
    try {
      const data = await getPasswordResetRequests(status);
      setRequests(data);
    } catch (e) {
      console.error("비밀번호 초기화 요청 목록 불러오기 실패:", e);
      setError("요청 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests(statusFilter);
  }, [statusFilter]);

  const handleApprove = async (id) => {
    const ok = window.confirm(
      "이 비밀번호 초기화 요청을 승인하시겠습니까?\n\n임시 비밀번호가 해당 사용자 이메일로 발송됩니다."
    );
    if (!ok) return;

    try {
      setActioningId(id);
      await approvePasswordResetRequest(id);
      alert("승인되었습니다. 임시 비밀번호가 사용자 이메일로 발송되었습니다.");
      loadRequests(statusFilter); // 현재 필터 기준으로 목록 새로 불러오기
    } catch (e) {
      console.error("승인 실패:", e);
      alert("승인 처리 중 오류가 발생했습니다.");
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("거절 사유를 입력해주세요.");
    if(reason === null) {
      return; // 취소 눌렀을 때
    }
    if(!reason.trim()) {
      alert("거절 사유를 입력해야 합니다.");
      return;
    }

    const ok = window.confirm("정말 이 비밀번호 초기화 요청을 거절하시겠습니까?");
    if(!ok) {
      return;
    }

    try {
      setActioningId(id);
      await rejectPasswordResetRequest(id, reason.trim());
      alert("요청이 거절되었습니다.");
      loadRequests(statusFilter); 
    } catch (e) {
      console.error("거절 실패:", e);
      alert("거절 처리 중 오류가 발생했습니다.");
    } finally {
      setActioningId(null);
    }
  };

  const renderStatusChip = (status) => {
    switch (status) {
      case "PENDING":
        return <Chip label="대기" color="warning" size="small" />;
      case "APPROVED":
        return <Chip label="승인" color="success" size="small" />;
      case "REJECTED":
        return <Chip label="거절" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Box
      sx={{
        px: 4,
        py: 3,
        width: "100%",
        maxWidth: 1440,
        mx: "auto",
      }}
    >
      {/* 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LockResetIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h5" fontWeight={700}>
            비밀번호 초기화 요청 관리
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          사용자가 요청한 비밀번호 초기화 내역을 조회하고 승인/거절할 수 있습니다.
        </Typography>
      </Box>

      <Card
        sx={{
          borderRadius: 3,
          boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          {/* 필터 + 상태 */}
          <Box
            sx={{
              mb: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant={statusFilter === "PENDING" ? "contained" : "outlined"}
                onClick={() => setStatusFilter("PENDING")}
              >
                대기
              </Button>
              <Button
                size="small"
                variant={statusFilter === "APPROVED" ? "contained" : "outlined"}
                onClick={() => setStatusFilter("APPROVED")}
              >
                승인
              </Button>
              <Button
                size="small"
                variant={statusFilter === "REJECTED" ? "contained" : "outlined"}
                onClick={() => setStatusFilter("REJECTED")}
              >
                거절
              </Button>
              <Button
                size="small"
                variant={statusFilter === "ALL" ? "contained" : "outlined"}
                onClick={() => setStatusFilter("ALL")}
              >
                전체
              </Button>
            </Stack>

            {loading && (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  불러오는 중...
                </Typography>
              </Stack>
            )}
          </Box>

          {error && (
            <Typography color="error" variant="body2" sx={{ mb: 1.5 }}>
              {error}
            </Typography>
          )}

          {/* 테이블 */}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">ID</TableCell>
                <TableCell>사용자</TableCell>
                <TableCell>사유</TableCell>
                <TableCell align="center">상태</TableCell>
                <TableCell>요청일시</TableCell>
                <TableCell>처리일시</TableCell>
                <TableCell align="center">액션</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      표시할 비밀번호 초기화 요청이 없습니다.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {requests.map((req) => (
                <TableRow key={req.id} hover>
                  <TableCell align="center">{req.id}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography variant="body2">{req.userName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {req.userEmail}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 260,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={req.reason || ""}
                    >
                      {req.reason || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">{renderStatusChip(req.status)}</TableCell>
                  <TableCell>
                    {req.createdAt
                      ? req.createdAt.replace("T", " ").slice(0, 16)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {req.processedAt
                      ? req.processedAt.replace("T", " ").slice(0, 16)
                      : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {req.status === "PENDING" ? (
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        disabled={actioningId === req.id}
                        onClick={() => handleApprove(req.id)}
                      >
                        승인
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        disabled={actioningId === req.id}
                        onClick={() => handleReject(req.id)}
                      >
                        거절
                      </Button>
                    </Stack>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        처리완료
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
