/**
 * handleError.js
 * 백엔드에서 내려오는 메시지를 프론트에서 그대로 보여주는 공통 함수
 * ResponseDTO(message) 또는 단순 문자열 형태 모두 지원
 */
export const handleApiError = (err, fallbackMessage = "요청 실패") => {
  const msg =
    err?.response?.data?.message || // ResponseDTO 구조
    err?.response?.data ||          // 단순 문자열
    fallbackMessage;                // fallback 문구

  alert(msg);
  console.error("[API ERROR]", msg);
};
