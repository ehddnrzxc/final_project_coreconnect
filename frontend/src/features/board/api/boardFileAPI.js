import http from "../../../api/http";

// 파일 업로드
export const uploadFiles = (boardId, files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  return http.post(`/board-file/${boardId}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// 게시글별 파일 목록 조회
export const getFilesByBoard = (boardId) =>
  http.get(`/board-file/board/${boardId}`);

// 단일 파일 조회
export const getFile = (fileId) => http.get(`/board-file/${fileId}`);

// 파일 삭제
export const deleteFile = (fileId) => http.delete(`/board-file/${fileId}`);

// ZIP 파일 다운로드
export const downloadZipFiles = async (boardId) => {
  return http.get(`/board-file/board/${boardId}/download-all`, {
    responseType: "blob",        // ZIP은 blob으로 받아야 함
  });
};

// 여러 파일 삭제 (1개 이상)
export const deleteFilesBulk = (fileIds) => {
  return http.delete(`/board-file/bulk`, {
    data: { fileIds }, // DELETE 메서드에서 body 보낼 때는 data 사용
  });
};
