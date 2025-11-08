import http from '../../../api/http.js';

// 메일 발송
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

// 로컬스토리지에서 현재 로그인한 사용자의 email을 꺼내오는 유틸 함수
function getUserEmailFromStorage() {
  const userString = localStorage.getItem("user");
  if (!userString) return null;
  try {
    const userObj = JSON.parse(userString);
    return userObj.email || null;
  } catch {
    return null;
  }
}

// 받은메일함 조회 (userId 그대로)
export const fetchInbox = (userId, page, size) => 
  http.get('/email/inbox', { params: {userId, page, size}});

// 보낸메일함 조회 (이메일 자동 사용)
// fetchSentbox: 컴포넌트에서 page, size만 파라미터로 받아 userEmail은 내부에서 자동 추출
export const fetchSentbox = (page, size) => {
  const userEmail = getUserEmailFromStorage();
  return http.get('/email/sentbox', { params: { userEmail, page, size }});
}

// 메일 상세 조회
export const getEmailDetail = (emailId) => 
  http.get(`/email/${emailId}`);

// 파일 다운로드 (첨부파일)
export const downloadAttachment = (fileId) => 
  http.get(`/email/file/download/${fileId}`, { responseType: 'blob' });