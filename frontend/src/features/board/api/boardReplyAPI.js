import http from "../../../api/http";


// 댓글 등록
export const createReply = (data) => http.post(`/board-reply`, data);

// 댓글 수정
export const updateReply = (replyId, data) =>
  http.put(`/board-reply/${replyId}`, data);

// 댓글 삭제
export const deleteReply = (replyId) =>
  http.delete(`/board-reply/${replyId}`);

// 게시글별 댓글 조회
export const getRepliesByBoard = (boardId) =>
  http.get(`/board-reply/board/${boardId}`);
