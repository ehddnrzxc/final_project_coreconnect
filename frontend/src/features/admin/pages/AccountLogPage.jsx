import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Stack,
  CircularProgress,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import { getAccountLogs } from "../api/adminAPI";
import { formatKoreanDate } from "../../../utils/TimeUtils";
import { getLogActionTypeLabel } from "../../../utils/labelUtils";

export default function AccountLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [emailFilter, setEmailFilter] = useState("");
  const [actionTypeFilter, setActionTypeFilter] = useState("");

  const actionTypeColors = {
    LOGIN: "success",
    LOGOUT: "default",
    FAIL: "error",
    REFRESH: "info",
  };

  useEffect(() => {
    loadLogs();
  }, [page, emailFilter, actionTypeFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await getAccountLogs(
        page,
        size,
        emailFilter || null,
        actionTypeFilter || null
      );
      setLogs(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error("로그인 이력 조회 실패:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage - 1); // MUI Pagination은 1부터 시작
  };

  const handleEmailFilterChange = (event) => {
    setEmailFilter(event.target.value);
    setPage(0); // 필터 변경 시 첫 페이지로
  };

  const handleActionTypeFilterChange = (event) => {
    setActionTypeFilter(event.target.value);
    setPage(0); // 필터 변경 시 첫 페이지로
  };

  return (
    <Box sx={{ px: 4, py: 3, width: "100%", maxWidth: 1400, mx: "auto" }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <HistoryIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" fontWeight={800}>
          로그인 이력
        </Typography>
      </Stack>

      <Card sx={{ borderRadius: 3, boxShadow: "0 12px 24px rgba(15,23,42,0.05)" }}>
        <Box sx={{ p: 3 }}>
          {/* 필터 영역 */}
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <TextField
              label="이메일 검색"
              variant="outlined"
              size="small"
              value={emailFilter}
              onChange={handleEmailFilterChange}
              placeholder="이메일 입력"
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>액션 타입</InputLabel>
              <Select
                value={actionTypeFilter}
                label="액션 타입"
                onChange={handleActionTypeFilterChange}
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="LOGIN">로그인</MenuItem>
                <MenuItem value="LOGOUT">로그아웃</MenuItem>
                <MenuItem value="FAIL">로그인 실패</MenuItem>
                <MenuItem value="REFRESH">토큰 재발급</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* 테이블 */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : logs.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                로그인 이력이 없습니다.
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>시간</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>사용자</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>이메일</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>액션</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>IP 주소</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.logId} hover>
                        <TableCell>
                          {formatKoreanDate(log.actionTime)}
                        </TableCell>
                        <TableCell>{log.userName}</TableCell>
                        <TableCell>{log.userEmail}</TableCell>
                        <TableCell>
                          <Chip
                            label={getLogActionTypeLabel(log.actionType)}
                            color={actionTypeColors[log.actionType] || "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{log.ipAddress || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={page + 1}
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                    sx={{
                      "& .MuiPaginationItem-root": {
                        backgroundColor: "transparent",
                        "&.Mui-selected": {
                          backgroundColor: "transparent",
                          color: "primary.main",
                          fontWeight: 700,
                        },
                        "&:hover": {
                          backgroundColor: "transparent",
                        },
                      },
                    }}
                  />
                </Box>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
                전체 {totalElements}건
              </Typography>
            </>
          )}
        </Box>
      </Card>
    </Box>
  );
}

