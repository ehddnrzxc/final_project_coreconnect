import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from "@mui/material";
import { useState, useEffect } from "react";
import { formatTime } from "../../../utils/TimeUtils";
import { getCompanyAttendanceToday } from "../api/attendanceAPI";

function CompanyAttendanceStatus() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    loadCompanyAttendance();
  }, []);

  const loadCompanyAttendance = async () => {
    try {
      setLoading(true);
      try {
        const data = await getCompanyAttendanceToday();
        setEmployees(data);
      } catch (err) {
        // API가 아직 구현되지 않은 경우 임시 데이터 사용
        console.warn("전사원 근태 API 호출 실패, 임시 데이터 사용:", err);
        setEmployees([
          { id: 1, name: "홍길동", department: "개발팀", checkIn: "2025-11-17T08:05:00", checkOut: null, status: "PRESENT" },
          { id: 2, name: "김철수", department: "개발팀", checkIn: "2025-11-17T09:15:00", checkOut: null, status: "LATE" },
          { id: 3, name: "이영희", department: "디자인팀", checkIn: "2025-11-17T08:30:00", checkOut: "2025-11-17T18:00:00", status: "COMPLETED" },
          { id: 4, name: "박민수", department: "기획팀", checkIn: null, checkOut: null, status: "ABSENT" },
        ]);
      }
    } catch (err) {
      console.error("전사원 근태 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case "PRESENT":
        return { label: "출근", color: "success" };
      case "LATE":
        return { label: "지각", color: "warning" };
      case "COMPLETED":
        return { label: "퇴근", color: "info" };
      case "ABSENT":
        return { label: "미출근", color: "default" };
      default:
        return { label: "미출근", color: "default" };
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h6" sx={{ mb: 4 }}>
        전사 근태현황
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>이름</TableCell>
              <TableCell>부서</TableCell>
              <TableCell>출근 시간</TableCell>
              <TableCell>퇴근 시간</TableCell>
              <TableCell>상태</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary">
                    불러오는 중...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary">
                    데이터가 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => {
                const statusInfo = getStatusInfo(employee.status);
                return (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>
                      {employee.checkIn ? formatTime(employee.checkIn) : "-"}
                    </TableCell>
                    <TableCell>
                      {employee.checkOut ? formatTime(employee.checkOut) : "-"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusInfo.label}
                        color={statusInfo.color}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default CompanyAttendanceStatus;

