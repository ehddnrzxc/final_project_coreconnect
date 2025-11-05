import { Box, Button, Chip, LinearProgress, Typography } from "@mui/material";
import { checkIn, checkOut, getTodayAttendance } from "../api/attendanceAPI";
import { formatKoreanDate, formatKoreanTime, formatTime } from "../../../utils/TimeUtils";
import { useState, useEffect } from "react";
import Card from "../../../components/ui/Card";

function AttendancePage() {
  const [now, setNow] = useState(new Date());
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await getTodayAttendance();
        setAttendance(data);
      } catch (e) {
        console.error("근태 조회 실패:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dateString = formatKoreanDate(now);
  const timeString = formatKoreanTime(now);

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

  useEffect(() => {
    loadAttendance();   
  }, []);

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



  // 데이터가 없을 때 기본값 처리
  const checkInTime = formatTime(attendance?.checkIn) || "-";
  const checkOutTime = formatTime(attendance?.checkOut) || "-";
  const status = attendance?.status || "ABSENT";
  const canCheckIn =
    status === "ABSENT"; // 미출근일 때만 출근 가능
  const canCheckOut =
    status === "PRESENT" || status === "LATE"; // 근무중/지각일 때만 퇴근 가능

  return (
    <Card
      title="근태"
      right={
        <Chip
          label={
            status === "PRESENT" || status === "LATE"
              ? "근무중"
              : status === "LEAVE_EARLY" || status === "COMPLETED"
              ? "퇴근"
              : "미출근"
          }
          size="small"
          variant="outlined"
          sx={{ fontSize: 12, borderRadius: 999, px: 1 }}
        />
      }
    >
      {/* 날짜 + 현재 시각 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="body2" color="text.secondary">
            {dateString} {timeString}
          </Typography>
        </Box>
      </Box>

      {/* 출근 / 퇴근 박스 */}
      <Box
        sx={{
          bgcolor: "grey.50",
          borderRadius: 3,
          px: 3,
          py: 2.5,
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 3,
        }}
      >
        {/* 출근 시간 */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            출근 시간
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            { checkInTime }
          </Typography>
        </Box>

        {/* 화살표 */}
        <Box sx={{ fontSize: 24, color: "text.disabled" }}>→</Box>

        {/* 퇴근 시간 */}
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            퇴근 시간
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            { checkOutTime }
          </Typography>
        </Box>
      </Box>

      {/* 주간 누적 영역 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          주간누적{" "}
          <Box component="span" sx={{ color: "success.main", fontWeight: 700 }}>
            44h 31m
          </Box>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          이번주 23h 50m 더 필요해요.
        </Typography>

        {/* 진행 바 + 0h / 40h / 52h */}
        <Box sx={{ mt: 1.5, position: "relative" }}>
          <LinearProgress
            variant="determinate"
            value={85}
            sx={{ height: 8, borderRadius: 999 }}
          />

          {/* 이모지 */}
          <Box
            sx={{
              position: "absolute",
              right: -10,
              top: -18,
              fontSize: 28,
            }}
          >
            🐰
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 0.75,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              0h
            </Typography>
            <Typography variant="caption" color="text.secondary">
              40h
            </Typography>
            <Typography variant="caption" color="text.secondary">
              52h
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 출근 / 퇴근 버튼 */}
      <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
        <Button fullWidth 
                variant="outlined" 
                onClick={handleCheckIn} 
                disabled={!canCheckIn}>
          출근하기
        </Button>
        <Button fullWidth
                variant="outlined" 
                onClick={handleCheckOut} 
                disabled={!canCheckOut}>
          퇴근하기
        </Button>
      </Box>
    </Card>
  );
}
export default AttendancePage;
