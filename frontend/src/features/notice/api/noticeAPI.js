import http from "../../../api/http";

/**
 * 전체 공지사항 목록 조회
 */
export async function getAllNotices(page = 0, size = 20) {
  const res = await http.get("/notice", {
    params: { page, size },
  });
  return res.data;
}

/**
 * 카테고리별 공지사항 목록 조회
 */
export async function getNoticesByCategory(category, page = 0, size = 20) {
  const res = await http.get(`/notice/category/${category}`, {
    params: { page, size },
  });
  return res.data;
}

/**
 * 카테고리별 공지사항 목록 조회 (페이징 없이)
 */
export async function getNoticesByCategoryList(category) {
  const res = await http.get(`/notice/category/${category}/list`);
  return res.data;
}

/**
 * 공지사항 상세 조회
 */
export async function getNoticeDetail(id) {
  const res = await http.get(`/notice/${id}`);
  return res.data;
}

/**
 * 전체 공지사항 목록 조회 (페이징 없이)
 */
export async function getAllNoticesList() {
  const res = await http.get("/notice/list");
  return res.data;
}

