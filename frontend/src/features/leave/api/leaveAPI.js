import http from "../../../api/http";

/** 내 휴가 목록 조회 */
export async function getMyLeaveRequests() {
  const res = await http.get("/leave/me");
  return res.data;
}

/** 휴가 신청(미사용) */
export async function createLeaveRequest(data) {
  const res = await http.post("/leave", data);
  return res.data;
}