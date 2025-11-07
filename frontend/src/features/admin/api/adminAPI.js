import http from "../../../api/http";

// 관리자용 통계 조회 API
export const getAdminStats = async () => {
  const res = await http.get("/admin/users/stats");
  return res.data;
}

// 비밀번호 초기화 요청 목록 조회
export async function getPasswordResetRequests(status) {
  const params = {};
  if (status && status !== "ALL") {
    params.status = status;
  }
  const res = await http.get("/admin/users/password-reset/requests", { params });
  return res.data;
}

// 비밀번호 초기화 요청 승인
export async function approvePasswordResetRequest(id) {
  const res = await http.put(`/admin/users/password-reset/requests/${id}/approve`);
  return res.data; // 204. res.data는 비어있음.
}