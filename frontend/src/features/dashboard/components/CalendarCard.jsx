import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import Card from "../../../components/ui/Card";
import {
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { getMonthlyScheduleSummary } from "../api/dashboardAPI";

const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];

const formatTimeRange = (item) => {
  if (!item?.startDateTime) return "시간 미정";
  const start = dayjs(item.startDateTime);
  const end = item?.endDateTime ? dayjs(item.endDateTime) : null;

  if (!end) return `${start.format("HH:mm")}`;
  if (start.isSame(end, "minute")) return `${start.format("HH:mm")}`;
  return `${start.format("HH:mm")} - ${end.format("HH:mm")}`;
};

export default function CalendarCard() {
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf("month"));
  const [summary, setSummary] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getMonthlyScheduleSummary(currentMonth.year(), currentMonth.month() + 1);
        const data = res.data?.data ?? res.data;
        setSummary(data);
      } catch (err) {
        console.error("월간 일정 요약 불러오기 실패:", err);
        setError("일정 정보를 불러올 수 없습니다.");
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [currentMonth]);

  useEffect(() => {
    if (!summary) return;
    const monthRef = dayjs(`${summary.year}-${String(summary.month).padStart(2, "0")}-01`);
    const selected = dayjs(selectedDate);

    if (!selected.isValid() || !selected.isSame(monthRef, "month")) {
      const today = dayjs();
      if (today.isSame(monthRef, "month")) {
        setSelectedDate(today.format("YYYY-MM-DD"));
      } else if (summary.days && summary.days.length > 0) {
        setSelectedDate(summary.days[0].date);
      } else {
        setSelectedDate(monthRef.format("YYYY-MM-DD"));
      }
    }
  }, [summary, selectedDate]);

  const summaryMap = useMemo(() => {
    const map = new Map();
    summary?.days?.forEach((day) => {
      map.set(day.date, day);
    });
    return map;
  }, [summary]);

  const calendarDays = useMemo(() => {
    const startOfMonth = currentMonth.startOf("month");
    const startOfGrid = startOfMonth.startOf("week");
    return Array.from({ length: 42 }).map((_, index) => {
      const date = startOfGrid.add(index, "day");
      const iso = date.format("YYYY-MM-DD");
      const info = summaryMap.get(iso);
      return {
        date,
        iso,
        count: info?.count ?? 0,
        items: info?.items ?? [],
        isCurrentMonth: date.month() === currentMonth.month(),
        isToday: date.isSame(dayjs(), "day"),
      };
    });
  }, [currentMonth, summaryMap]);

  const selectedInfo = summaryMap.get(selectedDate);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => prev.subtract(1, "month"));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => prev.add(1, "month"));
  };

  const handleSelectDate = (cell) => {
    if (!cell.isCurrentMonth) {
      setCurrentMonth(cell.date.startOf("month"));
    }
    setSelectedDate(cell.iso);
    setListOpen(true);
  };

  return (
    <Card
      title="캘린더"
      right={
        <Button component={Link} to="/calendar" size="small" sx={{ textTransform: "none" }}>
          자세히 보기
        </Button>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton size="small" onClick={handlePrevMonth}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <Typography variant="subtitle2">
              {currentMonth.format("YYYY년 M월")}
            </Typography>
            <IconButton size="small" onClick={handleNextMonth}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Stack>
          {loading && (
            <CircularProgress size={16} thickness={5} />
          )}
        </Stack>

        {error ? (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        ) : (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                textAlign: "center",
                color: "text.secondary",
                fontSize: 12,
              }}
            >
              {DAYS_OF_WEEK.map((day) => (
                <Typography key={day} variant="caption" sx={{ py: 0.5, fontWeight: 600 }}>
                  {day}
                </Typography>
              ))}
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 0.75,
              }}
            >
              {calendarDays.map((cell) => {
                const isSelected = cell.iso === selectedDate;
                return (
                  <Box
                    key={cell.iso}
                    onClick={() => handleSelectDate(cell)}
                    data-grid-cancel="true"
                    sx={{
                      position: "relative",
                      borderRadius: 1.5,
                      border: "1px solid",
                      borderColor: isSelected ? "primary.main" : "rgba(0,0,0,0.12)",
                      bgcolor: "transparent",
                      color: cell.isCurrentMonth ? "text.primary" : "text.disabled",
                      cursor: "pointer",
                      minHeight: 48,
                      padding: 1,
                      transition: "all 0.2s ease",
                      boxShadow: isSelected ? 2 : 0,
                      opacity: cell.isCurrentMonth ? 1 : 0.5,
                      borderWidth: isSelected ? 2 : 1,
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: isSelected ? 700 : 500 }}
                    >
                      {cell.date.date()}
                    </Typography>
                    {cell.count > 0 && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 1,
                          right: 1,
                          minWidth: 14,
                          height: 14,
                          borderRadius: "50%",
                          bgcolor: "error.main",
                          color: "#fff",
                          fontSize: "0.65rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          px: 0.25,
                        }}
                      >
                        {cell.count}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>

          </>
        )}
      </Box>

      <Dialog open={listOpen} onClose={() => setListOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {dayjs(selectedDate).format("YYYY년 M월 D일 (ddd)")}
        </DialogTitle>
        <DialogContent dividers>
          {selectedInfo && selectedInfo.items.length > 0 ? (
            <List dense>
              {selectedInfo.items.map((item) => (
                <ListItem key={item.id} disableGutters sx={{ pb: 1 }}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={600}>
                        {item.title}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {formatTimeRange(item)}
                        {item.location ? ` · ${item.location}` : ""}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              일정이 없습니다.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setListOpen(false)} sx={{ textTransform: "none" }}>
            닫기
          </Button>
          <Button
            component={Link}
            to="/calendar"
            onClick={() => setListOpen(false)}
            sx={{ textTransform: "none" }}
          >
            캘린더로 이동
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

