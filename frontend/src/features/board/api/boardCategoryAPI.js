import http from "../../../api/http";

// 전체 카테고리 목록 조회
export const getAllCategories = () => http.get(`/board-category`);

// 카테고리 등록 (관리자)
export const createCategory = (data) => http.post(`/board-category`, data);

// 카테고리 수정 (관리자)
export const updateCategory = (id, data) =>
  http.put(`/board-category/${id}`, data);

// 카테고리 삭제 (관리자)
export const deleteCategory = (id) => http.delete(`/board-category/${id}`);
