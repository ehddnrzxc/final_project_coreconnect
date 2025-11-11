import http from "../../../api/http";

/** 공지사항 목록 가져오기 */
export async function getDashboardNotices(size = 5) {
  const res = await http.get("/dashboard/notices/latest", {
    params: { size },
  });
  return res.data;
}

/** 공지사항 상세 */
export async function getDashboardNoticeDetail(id) {
  const res = await http.get(`/dashboard/notices/detail/${id}`);
  return res.data;
}
