import http from "../../../api/http";

/** 부서 목록(평탄화) 조회 */
export const fetchDepartmentsFlat = () =>
  http.get("/departments/flat").then((res) => res.data);

/** 부서 트리 구조 조회 */
export const fetchDepartmentTree = () =>
  http.get("/departments/tree").then((res) => res.data);

/** 부서 생성 */
export const createDepartment = (payload) => http.post("/departments", payload);

/** 부서 기본 정보 수정 */
export const updateDepartment = (id, payload) =>
  http.put(`/departments/${id}`, payload);

/** 부서 상위 이동 */
export const moveDepartment = (id, parentId) =>
  http.put(`/departments/${id}/move`, { parentId });

/** 부서 삭제 */
export const deleteDepartment = (id) => http.delete(`/departments/${id}`);
