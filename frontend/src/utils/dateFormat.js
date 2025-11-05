/** 날짜 포맷 유틸: JS와 백엔드(LocalDateTime) 간 변환 */

/**
 * JS Date → 백엔드 LocalDateTime 포맷 (yyyy-MM-dd HH:mm:ss)
 */
export const toBackendFormat = (input) => {
  if (!input) return null;
  const d = typeof input === "string" ? new Date(input) : input;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/**
 * 백엔드 LocalDateTime(yyyy-MM-dd HH:mm:ss)
 * → JS 인식 가능 포맷(yyyy-MM-ddTHH:mm:ss)
 */
export const toISO = (s) => (s ? s.replace(" ", "T") : s);
