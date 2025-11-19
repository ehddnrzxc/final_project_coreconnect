import http from "../../../api/http";


const BASE_URL = "/board-category"; 

// 전체 카테고리 조회
export const getAllCategories = () => http.get(BASE_URL);

// 카테고리 생성
export const createCategory = (data) => http.post(BASE_URL, data);

// 카테고리 수정
export const updateCategory = (id, data) => http.put(`${BASE_URL}/${id}`, data);

// 카테고리 삭제
export const deleteCategory = (id) => http.delete(`${BASE_URL}/${id}`);
