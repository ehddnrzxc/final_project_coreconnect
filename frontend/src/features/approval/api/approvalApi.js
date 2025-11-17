import http from "../../../api/http";

//===== 홈 (ApprovalHomePage) =====//

// 기안 진행 중인 문서 목록 조회
export const getPendingDocuments = () => http.get("/approvals/my-documents/pending");

// 완료 문서 목록 조회
export const getCompletedDocuments = () => http.get("/approvals/my-documents/completed");

//===== 

// 특정 결재 문서 상세 조회
export const getDocumentDetail = documentId => http.get(`/approvals/${documentId}`);

// 모든 양식 목록 조회
export const getTemplates = () => http.get("/approvals/templates");

// 특정 양식 상세 조회
export const getTemplateDetail = templateId => http.get(`/approvals/templates/${templateId}`);

// 새 결재 문서 상신
export const submitDocument = formData => http.post("/approvals", formData);

// 새 결재 문서 임시저장
export const saveDraft = formData => http.post("/approvals/drafts", formData);

// 임시저장 문서 수정
export const updateDraft = (documentId, formData) => http.put(`/approvals/drafts/${documentId}`, formData);

// 임시저장 문서 수정 후 상신
export const updateDocument = (documentId, formData) => http.put(`/approvals/${documentId}`, formData);

// 내 상신함 (내가 작성한 모든 문서)
export const getMyDocuments = () => http.get("/approvals/my-documents");

// 임시저장함
export const getMyDraftBox = () => http.get("/approvals/drafts");

// 내 결재함 (내가 결재할 문서)
export const getMyTasks = () => http.get("/approvals/my-tasks");

// 내 참조함 (내가 참조자로 지정된 문서)
export const getMyReferenceDocuments = () => http.get("/approvals/my-reference-docs");

// 문서 승인
export const approveDocument = (documentId, requestDTO) => http.post(`/approvals/${documentId}/approve`, requestDTO);

// 문서 반려
export const rejectDocument = (documentId, requestDTO) => http.post(`/approvals/${documentId}/reject`, requestDTO);

// 파일 다운로드 (첨부파일)
export const downloadFile = async (fileId, fileName) => {
  const res = await http.get(`/approvals/file/download/${fileId}`);
  const url_2 = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url_2;
  link.setAttribute('download', fileName || `attachment_${fileId}`);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
};