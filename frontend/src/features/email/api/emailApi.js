import http from '../../../api/http.js';

// 로컬스토리지에서 로그인 사용자 email 추출
export function getUserEmailFromStorage() {
  const userString = localStorage.getItem("user");
  if (!userString) return null;
  try {
    const userObj = JSON.parse(userString);
    return userObj.email || null;
  } catch {
    return null;
  }
}

// 기본 받은메일함 조회 (기본 옵션만)
export const fetchInboxSimple = (userEmail, page, size, filter) =>
  http.get('/email/inbox', { params: { userEmail, page, size, filter } });




/**
 * 받은메일함 조회 (정렬/추가옵션 지원)
 */
export const fetchInbox = (
  userEmail, page, size, filter,
  sortField = null, sortDirection = null
) => {
  const params = { userEmail, page, size, filter };
  if (sortField) params.sortField = sortField;
  if (sortDirection) params.sortDirection = sortDirection;
  return http.get('/email/inbox', { params });
};

// '안읽은 메일' 개수 조회 (Controller의 /email/inbox/unread-count와 매칭)
export const fetchUnreadCount = (userEmail) =>
  http
    .get('/email/inbox/unread-count', { params: { userEmail } })
    .then(res => res.data.data);

// 메일 상세 조회 (userEmail 동봉)
export const getEmailDetail = (emailId, userEmail) => {
  return http.get(`/email/${emailId}`, { params: { userEmail } });
};

// 메일 읽음 처리 API (PATCH) - 프론트엔드에서 이걸 불러야 사이드바 숫자 갱신이 가능!
export const markMailAsRead = (emailId, userEmail) =>
  http.patch(`/email/${emailId}/read`, { userEmail });

// 파일 다운로드 (첨부파일)
export const downloadAttachment = (fileId, fileName) => {
  return http.get(`/email/file/download/${fileId}`, { responseType: 'blob' }).then(res => {
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || `attachment_${fileId}`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  });
};

export const sendMail = (mailData) => {
  const formData = new FormData();
  const { attachments, ...pureData } = mailData;
  formData.append(
    "data",
    new Blob([JSON.stringify(pureData)], { type: "application/json" })
  );
  if (attachments && attachments.length) {
    attachments.forEach(file => {
      formData.append("attachments", file);
    });
  }
  return http.post('/email/send', formData);
};

export const fetchSentbox = (page, size) => {
  const userEmail = getUserEmailFromStorage();
  return http.get('/email/sentbox', { params: { userEmail, page, size } });
};

export const downloadAllAttachments = (attachments = []) => {
  attachments.forEach(file => {
    downloadAttachment(file.fileId, file.fileName);
  });
};

// 임시저장 메일 생성 API
export const saveDraftMail = (mailData) => {
  const formData = new FormData();
  const { attachments, ...pureData } = mailData;
  formData.append(
    "data",
    new Blob([JSON.stringify(pureData)], { type: "application/json" })
  );
  if (attachments && attachments.length) {
    attachments.forEach(file => {
      formData.append("attachments", file);
    });
  }
  return http.post('/email/draft', formData);
};

// 임시보관함(임시저장 메일함) 목록 조회
export const fetchDraftbox = (userEmail, page = 0, size = 20) =>
  http.get('/email/draftbox', { params: { userEmail, page, size } });

// 임시보관함 안읽은 개수 조회 (or 전체 임시저장 메일 개수)
export const fetchDraftCount = (userEmail) =>
  http.get('/email/draftbox/count', { params: { userEmail } })
    .then(res => res.data.data);


// 임시저장 메일 상세 보기
export const getDraftDetail = (draftId, userEmail) =>
  http.get(`/email/draft/${draftId}`, { params: { userEmail } });

// 임시메일 삭제 API 함수 예시
export function deleteDraftMail(draftId) {
  // BASE_URL + /email/draft/delete/53 -> /api/v1/email/draft/delete/53
  return http.delete(`/email/draft/delete/${draftId}`);
}

// ... 기존 함수들 ...

// 선택된 이메일을 휴지통(TRASH)으로 이동
export const moveToTrash = (emailIds) => {
  return http.post('/email/move-to-trash', emailIds);
};

// 휴지통 비우기 (현재 사용자 휴지통의 모든 TRASH -> DELETED)
export const emptyTrash = () => {
  return http.post('/email/trash/empty');
};

// 휴지통(TRASH) 메일 목록 조회
export const fetchTrashList = (userEmail, page = 0, size = 20) => 
  http.get('/email/trash', { params: { userEmail, page, size } });