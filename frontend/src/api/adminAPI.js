import http from "./http";

// 관리자용 통계 조회 API
export const getAdminStats = async () => {
  const res = await http.get("/admin/users/stats");
  return res.data;
}