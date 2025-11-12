import http from "../../../api/http";

// 로컬(KST 가정) 오늘 00:00~내일 00:00
function getTodayRangeKST() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  return { start, end };
}

// "YYYY-MM-DDTHH:mm:ss" 를 안전하게 파싱 
function parseLocalDateTime(s) {
  if (!s) return new Date(NaN);
  const [date, time = "00:00:00"] = s.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm, ss] = time.split(":").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, ss ?? 0);
}

/** 내부 유틸: Page/배열 응답 어떤 형식이든 카운트 빼기 */
function extractCount(res) {
  const raw = res?.data;
  const page = raw?.data ?? raw;           // ResponseDTO<Page<...>> | Page | Array
  if (Array.isArray(page)) return page.length;
  if (typeof page?.totalElements === "number") return page.totalElements;
  if (Array.isArray(page?.content)) return page.content.length;
  return 0;
}

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

/** 사용자 부서의 게시판 카테고리 ID 조회 (응답 형태 유연 대응) */
export async function getMyDeptBoardCategoryId() {
  const res = await http.get("/dashboard/my-department");
  const raw = res.data;
  const data = raw?.data ?? raw;
  return (
    data?.categoryId ??
    data?.id ??
    (typeof data === "number" ? data : null)
  );
}

/** 오늘(클라 기준) 새 글 카운트 - API 변경 없이 페이지를 훑어서 카운트 */
export async function countTodayPostsByCategoryClientOnly(categoryId, pageSize = 100, maxPages = 5) {
  const { start, end } = getTodayRangeKST();
  let page = 0;
  let total = 0;

  while (page < maxPages) {
    const { data } = await http.get(`/board/category/${categoryId}`, {
      params: { sortType: "latest", page, size: pageSize },
    });

    const pageData = data?.data; 
    const content = pageData?.content ?? [];
    if (content.length === 0) break;

    for (const item of content) {
      const created = parseLocalDateTime(item.createdAt); 
      if (created >= start && created < end) {
        total++;
      } else if (created < start) {
        return total; 
      }
    }

    const last = content[content.length - 1];
    const lastDate = parseLocalDateTime(last?.createdAt);
    if (lastDate < start) break;
    if (page + 1 >= (pageData?.totalPages ?? Infinity)) break;
    page++;
  }

  return total;
}

/** 내가 결재해야 할 문서 수 */
export async function getMyPendingApprovalCount() {
  const res = await http.get("/approvals/my-tasks", {
    params: { page: 0, size: 1, sort: "createdAt,desc" },
  });
  return extractCount(res);
}