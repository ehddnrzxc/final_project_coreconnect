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