import http from "../../../api/http";

// 전체 게시글 목록 (페이징)
export const getAllBoards = (page = 0, size = 10) =>
  http.get(`/board?page=${page}&size=${size}`);

// 카테고리별 게시글 목록
export const getBoardsByCategory = (categoryId, page = 0, size = 10) =>
  http.get(`/board/category/${categoryId}?page=${page}&size=${size}`);

// 게시글 상세
export const getBoardDetail = (boardId) => http.get(`/board/${boardId}`);

// 게시글 등록
export const createBoard = (data) => http.post(`/board`, data);

// 게시글 수정
export const updateBoard = (boardId, data) =>
  http.put(`/board/${boardId}`, data);

// 게시글 삭제
export const deleteBoard = (boardId) => http.delete(`/board/${boardId}`);

// 게시글 검색 (제목 / 내용 / 작성자)
export const searchBoards = (type, keyword, page = 0, size = 10) =>
  http.get(`/board/search?type=${type}&keyword=${keyword}&page=${page}&size=${size}`);

// 전체 게시판 목록 조회 (상단고정 -> 공지 -> 최신순)
export const getBoardsOrdered = (page = 0, size = 10) =>
  http.get(`/board/ordered?page=${page}&size=${size}`);
