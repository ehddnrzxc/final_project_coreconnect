import http from "../../../api/http";

/** 관리자용 통계 조회 API */
export const getAdminStats = async () => {
  const res = await http.get("/admin/users/stats");
  return res.data;
}

/** 비밀번호 초기화 요청 목록 조회 */
export async function getPasswordResetRequests(status) {
  const params = {};
  if (status && status !== "ALL") {
    params.status = status;
  }
  const res = await http.get("/admin/users/password-reset/requests", { params });
  return res.data;
}

/** 비밀번호 초기화 요청 승인 */
export async function approvePasswordResetRequest(id) {
  const res = await http.put(`/admin/users/password-reset/requests/${id}/approve`);
  return res.data; 
}

/** 비밀번호 초기화 요청 거절 */
export async function rejectPasswordResetRequest(id, rejectReason) {
  const res = await http.put(
    `/admin/users/password-reset/requests/${id}/reject`,
    { reason: rejectReason }
  );
  return res.data; 
}

/** 휴가 요청 전체 조회 */
export async function getAdminLeaveRequests() {
  const res = await http.get("/admin/leave");
  return res.data;
}

/** 대기 중인 휴가 요청 조회 */
export async function getPendingLeaveRequests() {
  const res = await http.get("/admin/leave/pending");
  return res.data;
}

/** 휴가 요청 승인 */
export async function approveLeaveRequest(id) {
  await http.post(`/admin/leave/${id}/approve`);
}

/** 휴가 요청 반려 */
export async function rejectLeaveRequest(id, reason) {
  await http.post(`/admin/leave/${id}/reject`, { reason });
}

/** 로그인 이력 조회 */
export async function getAccountLogs(page = 0, size = 20, email = null, actionType = null) {
  const params = { page, size };
  if (email) params.email = email;
  if (actionType) params.actionType = actionType;
  const res = await http.get("/admin/account-logs", { params });
  return res.data;
}