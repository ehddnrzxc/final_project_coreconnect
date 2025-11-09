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

// 받은메일함 조회 (filter: today/unread 등 옵션)
export const fetchInbox = (userEmail, page, size, filter) =>
  http.get('/email/inbox', { params: { userEmail, page, size, filter } });

// '안읽은 메일' 개수 조회 (Controller의 /email/inbox/unread-count와 매칭)
export const fetchUnreadCount = (userEmail) =>
  http
    .get('/email/inbox/unread-count', { params: { userEmail } })
    .then(res => res.data.data);

// 메일 상세 조회 (userEmail 동봉)
export const getEmailDetail = (emailId, userEmail) => {
  return http.get(`/email/${emailId}`, { params: { userEmail } });
};

// 파일 다운로드 (첨부파일)
export const downloadAttachment = (fileId, fileName) => {
  return http.get(`/email/file/download/${fileId}`, { responseType: 'blob' }).then(res => {
    // 프론트에서 blob을 파일 형태로 저장 (다운로드)
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || `attachment_${fileId}`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  });
};

// ⬇️ 메일 발송 API, 이걸 반드시 추가해주세요!
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

// '보낸메일함' 목록 조회 함수 (Page, Size 사용)
export const fetchSentbox = (page, size) => {
  const userEmail = getUserEmailFromStorage();
  return http.get('/email/sentbox', { params: { userEmail, page, size } });
};

//  전체 첨부파일 일괄 다운로드 (옵션)
// 필요하다면, 프론트에서 여러 fileId에 대해 반복 호출해 처리할 수도 있습니다.
// 파일 서버에서 여러 파일을 압축(zip 등)해 일괄 다운로드 지원시 별도의 API 필요
export const downloadAllAttachments = (attachments = []) => {
  attachments.forEach(file => {
    downloadAttachment(file.fileId, file.fileName);
  });
};