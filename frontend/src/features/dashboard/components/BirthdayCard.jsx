import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import Card from "../../../components/ui/Card";
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Stack,
  CircularProgress,
  Pagination,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CelebrationIcon from "@mui/icons-material/Celebration";
import { getBirthdayUsers } from "../../user/api/userAPI";
import { useTheme } from "@mui/material/styles";

export default function BirthdayCard({ onUserClick }) {
  const theme = useTheme();
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf("month"));
  const [birthdayUsers, setBirthdayUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 4; // 한 페이지에 표시할 생일자 수

  useEffect(() => {
    const fetchBirthdayUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const users = await getBirthdayUsers(
          currentMonth.year(),
          currentMonth.month() + 1
        );
        setBirthdayUsers(users || []);
        setPage(1); // 월 변경 시 페이지 리셋
      } catch (err) {
        console.error("생일자 목록 불러오기 실패:", err);
        setError("생일자 정보를 불러올 수 없습니다.");
        setBirthdayUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBirthdayUsers();
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => prev.subtract(1, "month"));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => prev.add(1, "month"));
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(birthdayUsers.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageUsers = birthdayUsers.slice(startIndex, endIndex);

  const formatBirthday = (birthday) => {
    if (!birthday) return "";
    const date = dayjs(birthday);
    return date.format("MM/DD");
  };

  return (
    <Card title="생일">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* 월 네비게이션 */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton size="small" onClick={handlePrevMonth}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <Typography variant="subtitle2" sx={{ minWidth: 80, textAlign: "center" }}>
              {currentMonth.format("YYYY.MM")}
            </Typography>
            <IconButton size="small" onClick={handleNextMonth}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Stack>
          {loading && <CircularProgress size={16} thickness={5} />}
        </Stack>

        {/* 생일자 목록 */}
        {error ? (
          <Typography variant="body2" color="error" sx={{ py: 2 }}>
            {error}
          </Typography>
        ) : loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : currentPageUsers.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ py: 4, textAlign: "center" }}
          >
            이번 달 생일자가 없습니다.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {currentPageUsers.map((user) => (
              <Box
                key={user.userId}
                onClick={() => onUserClick && onUserClick(user)}
                data-grid-cancel="true"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 1.5,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: "action.hover",
                    borderColor: "primary.main",
                  },
                }}
              >
                <Avatar
                  src={user.profileImageUrl}
                  alt={user.name}
                  sx={{ width: 48, height: 48 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <CelebrationIcon
                      sx={{
                        fontSize: 16,
                        color: "primary.main",
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "primary.main",
                      }}
                    >
                      {formatBirthday(user.birthday)}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
                    {user.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    {user.deptName || "부서 없음"}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(event, value) => setPage(value)}
              size="small"
              color="primary"
            />
          </Box>
        )}
      </Box>
    </Card>
  );
}

