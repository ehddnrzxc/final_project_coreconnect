import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  Avatar,
  Chip,
  Pagination,
  Stack,
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { getCompanyLeaveWeekly, getCompanyLeaveDetails } from "../api/leaveAPI";

// 날짜 포맷팅 함수 (컴포넌트 외부로 이동)
const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

/** 전사 휴가현황 컴포넌트 */
export default function CompanyLeaveStatus() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: 휴가현황, 1: 연차, 2: 기타휴가
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // 현재 주의 월요일 계산
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // 월요일로 조정
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [leaveDetails, setLeaveDetails] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);

  // 주 단위 데이터 로드 (currentWeekStart 변경 시에만)
  useEffect(() => {
    const loadWeeklyData = async () => {
      try {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const startDate = formatDate(currentWeekStart);
        const endDate = formatDate(weekEnd);
        const data = await getCompanyLeaveWeekly(startDate, endDate);
        setWeeklyData(data);
      } catch (e) {
        console.error("주 단위 휴가 데이터 로딩 실패:", e);
      }
    };
    loadWeeklyData();
  }, [currentWeekStart]);

  // 상세 목록 로드 (선택된 날짜 또는 주간 전체)
  useEffect(() => {
    const loadLeaveDetails = async () => {
      try {
        setLoading(true);
        let startDate, endDate;
        
        if (selectedDate) {
          // 날짜가 선택된 경우: 해당 날짜만 조회
          const selected = new Date(selectedDate);
          startDate = formatDate(selected);
          endDate = formatDate(selected);
        } else {
          // 날짜가 선택되지 않은 경우: 주간 전체 조회
          const weekEnd = new Date(currentWeekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          startDate = formatDate(currentWeekStart);
          endDate = formatDate(weekEnd);
        }
        
        const leaveType = activeTab === 1 ? "연차" : activeTab === 2 ? "기타" : null;
        
        const response = await getCompanyLeaveDetails(startDate, endDate, leaveType, null, page, size);
        setLeaveDetails(response.content || []);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      } catch (e) {
        console.error("전사 휴가 상세 로딩 실패:", e);
      } finally {
        setLoading(false);
      }
    };
    loadLeaveDetails();
  }, [currentWeekStart, activeTab, page, size, selectedDate]);

  // 주 이동
  const moveWeek = (direction) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentWeekStart(newDate);
    setSelectedDate(null); // 주가 바뀌면 선택된 날짜 초기화
    setPage(0); // 주가 바뀌면 첫 페이지로
  };

  // 오늘로 이동
  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
    setSelectedDate(null); // 오늘로 이동 시 선택된 날짜 초기화
    setPage(0);
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (dateStr) => {
    if (selectedDate === dateStr) {
      // 같은 날짜를 다시 클릭하면 선택 해제 (전체 주간 보기)
      setSelectedDate(null);
    } else {
      // 다른 날짜 클릭 시 해당 날짜 선택
      setSelectedDate(dateStr);
    }
    setPage(0); // 날짜 변경 시 첫 페이지로
  };

  // 탭 변경 시 첫 페이지로
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSelectedDate(null); // 탭 변경 시 선택된 날짜 초기화
    setPage(0);
  };

  // 날짜 포맷팅 (YYYY-MM-DD)
  const formatDateString = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // 요일 이름
  const getDayName = (date) => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return days[date.getDay()];
  };

  // 주의 시작일과 종료일 계산 (렌더링용)
  const weekEnd = useMemo(() => {
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    return end;
  }, [currentWeekStart]);

  // 주의 모든 날짜 생성
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentWeekStart]);

  // 날짜별 휴가자 수 맵
  const leaveCountMap = new Map();
  weeklyData.forEach((item) => {
    leaveCountMap.set(item.date, item.leaveCount);
  });

  // 휴가 유형 아이콘/라벨
  const getLeaveTypeLabel = (type) => {
    const typeMap = {
      연차: { label: "연차", color: "primary" },
      반차: { label: "반차", color: "info" },
      병가: { label: "병가", color: "warning" },
      경조사: { label: "경조사", color: "success" },
      배우자돌봄휴가: { label: "배우자돌봄휴가", color: "default" },
    };
    return typeMap[type] || { label: type, color: "default" };
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 탭 */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="휴가현황" />
          <Tab label="연차" />
          <Tab label="기타휴가" />
        </Tabs>
      </Box>

      {/* 주 단위 캘린더 */}
      <Paper elevation={0} sx={{ mb: 3, p: 3, border: "1px solid", borderColor: "divider" }}>
        {/* 날짜 네비게이션 */}
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mb: 3, gap: 2 }}>
          <IconButton onClick={() => moveWeek(-1)} size="small">
            <ArrowBackIosIcon fontSize="small" />
          </IconButton>
          <Typography variant="body1" sx={{ minWidth: 200, textAlign: "center" }}>
            {formatDateString(currentWeekStart)} ~ {formatDateString(weekEnd)}
          </Typography>
          <IconButton onClick={() => moveWeek(1)} size="small">
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
          <Button variant="outlined" size="small" onClick={goToToday} sx={{ ml: 2 }}>
            오늘
          </Button>
        </Box>

        {/* 주 단위 캘린더 그리드 */}
        <Box sx={{ display: "flex", gap: 1 }}>
          {weekDays.map((date, index) => {
            const dateStr = formatDateString(date);
            const count = leaveCountMap.get(dateStr) || 0;
            const isSelected = selectedDate === dateStr;
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            return (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  border: isSelected ? "2px solid" : "1px solid",
                  borderColor: isSelected ? "primary.main" : "divider",
                  borderRadius: 1,
                  p: 1.5,
                  bgcolor: isSelected ? "primary.50" : "background.paper",
                  cursor: "pointer",
                  opacity: isWeekend ? 0.6 : 1,
                }}
                onClick={() => handleDateClick(dateStr)}
              >
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  {date.getDate()}일 ({getDayName(date)})
                </Typography>
                {count > 0 && (
                  <Button
                    variant="contained"
                    size="small"
                    sx={{
                      mt: 1,
                      minWidth: "auto",
                      px: 1,
                      py: 0.5,
                      fontSize: 12,
                    }}
                  >
                    휴가자 {count}명
                  </Button>
                )}
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* 선택된 날짜 표시 */}
      {selectedDate && (
        <Box sx={{ mb: 2, mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {formatDateString(selectedDate)}의 휴가자 목록
          </Typography>
        </Box>
      )}

      {/* 페이지 크기 선택 */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <Select value={size} onChange={(e) => { setSize(e.target.value); setPage(0); }}>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 상세 테이블 */}
      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "grey.50" }}>
              <TableCell sx={{ fontWeight: 600 }}>사번</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>사원명</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>부서명</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>휴가유형</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>휴가사용일</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>사용휴가</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>휴가사용기간</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : leaveDetails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              leaveDetails.map((item) => {
                const typeInfo = getLeaveTypeLabel(item.leaveType);
                const dateRange = item.leaveDates && item.leaveDates.length > 0
                  ? `${formatDateString(item.leaveDates[0])}${item.leaveDates.length > 1 ? `, ${formatDateString(item.leaveDates[item.leaveDates.length - 1])}` : ""}`
                  : "-";

                return (
                  <TableRow key={item.leaveReqId} hover>
                    <TableCell>{item.employeeNumber || item.userId || "-"}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                          {item.employeeName?.charAt(0) || "?"}
                        </Avatar>
                        <Typography variant="body2">{item.employeeName || "-"}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{item.departmentName || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        label={typeInfo.label}
                        size="small"
                        color={typeInfo.color}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: 13 }}>
                        {dateRange}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.usedDays}d</TableCell>
                    <TableCell>{item.leavePeriod}d</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* 페이지네이션 */}
      {totalPages > 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={(event, value) => setPage(value - 1)}
              color="primary"
              showFirstButton
              showLastButton
            />
            <Typography variant="body2" color="text.secondary">
              총 {totalElements}건
            </Typography>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
