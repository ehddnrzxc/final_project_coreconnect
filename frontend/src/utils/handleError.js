/**
 * handleError.js
 * 공통 API 에러 처리 유틸
 * - 백엔드에서 내려오는 메시지를 alert으로 사용자에게 직접 표시
 * - ResponseDTO 형태(message 필드) 또는 단순 문자열 응답 모두 지원
 */

export const handleApiError = (err, fallbackMessage = "요청 실패") => {
  // 백엔드 응답 메시지 우선순위에 따라 메시지 추출
  const msg =
    err?.response?.data?.message || // ResponseDTO 구조: { message, data, status }
    err?.response?.data ||          // 단순 문자열 응답
    fallbackMessage;                // 기본 메시지 (fallback)

  alert(msg);                       // 사용자에게 알림창 표시
};
