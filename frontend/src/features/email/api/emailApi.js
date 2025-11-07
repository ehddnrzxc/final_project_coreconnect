
import http from '../../../api/http.js';

// 메일 발송
export const sendMail = (mailData) => {
  const formData = new FormData();
  const { attachments, ...pureData } = mailData;
  // JSON 데이터는 반드시 data라는 키에 Blob으로 전달해야 Spring @RequestPart("data")에서 매핑됩니다!
  formData.append(
    "data",
    new Blob([JSON.stringify(pureData)], { type: "application/json" })
  );
  if (attachments && attachments.length) {
    attachments.forEach(file => {
      formData.append("attachments", file);
    });
  }
  // Content-Type 지정 안하는 것!! (브라우저가 자동으로 멀티파트 설정)
  return http.post('/email/send', formData);
};

// 받은메일함 조회
export const fetchInbox = (userId, page, size) => 
  http.get('/email/inbox', { params: {userId, page, size}});

// 보낸메일함 조회
export const fetchSentbox = (userId, page, size) => 
  http.get('/email/sentbox', { params: {userId, page, size}});

// 메일 상세 조회
export const getEmailDetail = (emailId) => 
  http.get(`/email/${emailId}`);




// 팡리 다운로드 (첨부파일)
export const  downloadAttachment = (fileId) => 
  http.get(`/email/file/download/${fileId}`, { responseType: 'blob'});
