import http from "../../../api/http"; // 공통 http 인스턴스

// 조직도 데이터 조회
export async function fetchOrganizationTree() {
  const res = await http.get("/organ"); 
  return res.data.data; // 실제 데이터 반환
}
