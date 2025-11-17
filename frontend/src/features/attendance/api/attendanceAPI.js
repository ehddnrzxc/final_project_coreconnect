import http from "../../../api/http";

/** 출근 처리 */
export async function checkIn() {
  const res = await http.post("/attendance/check-in");
  return res.data;
}

/** 퇴근 처리 */
export async function checkOut() {
  const res = await http.post("/attendance/check-out");
  return res.data;
}

/** 출퇴근 정보 조회 */
export async function getTodayAttendance() {
  const res = await http.get("/attendance/me/today");
  return res.data;
}

/** 주간/월간 근태 통계 조회 */
export async function getAttendanceStatistics(period, date) {
  const endpoint = period === "weekly" ? "/attendance/me/weekly-stats" : "/attendance/me/monthly-stats";
  const res = await http.get(endpoint, { params: { date } });
  return res.data;
}

/** 전사원 오늘 근태 현황 조회 */
export async function getCompanyAttendanceToday() {
  const res = await http.get("/attendance/company/today");
  return res.data;
}

/** 주간 일별 근태 상세 조회 */
export async function getWeeklyAttendanceDetail(date) {
  const res = await http.get("/attendance/me/weekly-detail", {
    params: { date },
  });
  return res.data;
}

/** 월간 일별 근태 상세 조회 */
export async function getMonthlyAttendanceDetail(date) {
  const res = await http.get("/attendance/me/monthly-detail", {
    params: { date },
  });
  return res.data;
}