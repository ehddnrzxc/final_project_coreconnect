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

/** 연차 사용 현황 */
export async function getMyLeaveSummary() {
  const res = await http.get("/leave/summary");
  return res.data;
}

/** 주 단위 휴가자 수 조회 */
export async function getCompanyLeaveWeekly(startDate, endDate) {
  const res = await http.get("/leave/company/weekly", {
    params: {
      startDate: startDate,
      endDate: endDate,
    },
  });
  return res.data;
}

/** 전사 휴가 상세 목록 조회 */
export async function getCompanyLeaveDetails(startDate, endDate, leaveType, page = 0, size = 50) {
  const params = {
    startDate: startDate,
    endDate: endDate,
    page: page,
    size: size,
  };
  if (leaveType) {
    params.leaveType = leaveType;
  }
  const res = await http.get("/leave/company/details", { params });
  return res.data;
}

/** 휴가 유형 목록 조회 */
export async function getLeaveTypes() {
  const res = await http.get("/leave/types");
  return res.data;
}