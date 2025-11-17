import { Box, Button, Chip, Typography, useTheme, Container, Paper, List, ListItemButton, ListItemText, Divider } from "@mui/material";
import { checkIn, checkOut, getTodayAttendance } from "../api/attendanceAPI";
import { formatKoreanDate, formatKoreanTime, formatTime } from "../../../utils/TimeUtils";
import { useState, useEffect } from "react";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import MyAttendanceStatus from "../components/MyAttendanceStatus";
import CompanyAttendanceStatus from "../components/CompanyAttendanceStatus";

function AttendanceLayout() {
  const theme = useTheme();
  const [now, setNow] = useState(new Date());
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState("my-attendance"); // "my-attendance" or "company-attendance"
  
  const dateString = formatKoreanDate(now);
  const timeString = formatKoreanTime(now);
  
  // 데이터가 없을 때 기본값 처리
  const checkInTime = formatTime(attendance?.checkIn) || "-";
  const checkOutTime = formatTime(attendance?.checkOut) || "-";
  const status = attendance?.status || "ABSENT";
  const canCheckIn = status === "ABSENT"; // 미출근일 때만 출근 가능
  const canCheckOut = status === "PRESENT" || status === "LATE"; // 근무중/지각일 때만 퇴근 가능
  
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const data = await getTodayAttendance();
      setAttendance(data);
    } catch (err) {
      console.error("근태 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await checkIn();
      await loadAttendance();
      alert("출근 처리되었습니다.");
    } catch (err) {
      console.error(err);
      alert("출근 처리에 실패했습니다.");
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut();
      await loadAttendance();
      alert("퇴근 처리되었습니다.");
    } catch (err) {
      console.error(err);
      alert("퇴근 처리에 실패했습니다.");
    }
  };

  const getStatusInfo = () => {
    switch (status) {
      case "PRESENT":
        return { label: "출근", color: "success" };
      case "LATE":
        return { label: "지각", color: "warning" };
      case "LEAVE_EARLY":
      case "COMPLETED":
        return { label: "퇴근", color: "info" };
      default:
        return { label: "미출근", color: "default" };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* 왼쪽 사이드바 */}
      <Paper
        elevation={2}
        sx={{
          width: 280,
          minWidth: 280,
          height: "100%",
          borderRadius: 0,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid",
          borderColor: "divider",
        }}
      >
        {/* 근태 헤더 */}
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="h6" fontWeight={600}>
            근태
          </Typography>
        </Box>

        {/* 현재 날짜/시간 및 상태 */}
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {dateString}
            </Typography>
            <Chip
              label={statusInfo.label}
              color={statusInfo.color}
              size="small"
              sx={{ fontSize: 12 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {timeString}
          </Typography>
        </Box>

        {/* 출근/퇴근 시간 */}
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
              출근 시간
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {checkInTime}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
              퇴근 시간
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {checkOutTime}
            </Typography>
          </Box>
        </Box>

        {/* 출근/퇴근 버튼 */}
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleCheckIn}
              disabled={!canCheckIn}
              sx={{ py: 1.5 }}
            >
              출근하기
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleCheckOut}
              disabled={!canCheckOut}
              sx={{ py: 1.5 }}
            >
              퇴근하기
            </Button>
          </Box>
        </Box>

        {/* 메뉴 */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontWeight: 600 }}>
              내 근태관리
            </Typography>
            <List sx={{ p: 0 }}>
              <ListItemButton
                selected={selectedMenu === "my-attendance"}
                onClick={() => setSelectedMenu("my-attendance")}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "white",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                  },
                }}
              >
                <ListItemText primary="내 근태현황" />
              </ListItemButton>
            </List>
          </Box>

          <Divider />

          <Box sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontWeight: 600 }}>
              전사 근태관리
            </Typography>
            <List sx={{ p: 0 }}>
              <ListItemButton
                selected={selectedMenu === "company-attendance"}
                onClick={() => setSelectedMenu("company-attendance")}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "white",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                  },
                }}
              >
                <ListItemText primary="전사 근태현황" />
              </ListItemButton>
            </List>
          </Box>
        </Box>
      </Paper>

      {/* 메인 콘텐츠 영역 */}
      <Box sx={{ flex: 1, overflowY: "auto", bgcolor: "background.default" }}>
        {selectedMenu === "my-attendance" && <MyAttendanceStatus />}
        {selectedMenu === "company-attendance" && <CompanyAttendanceStatus />}
      </Box>
    </Box>
  );
}

export default AttendanceLayout;

