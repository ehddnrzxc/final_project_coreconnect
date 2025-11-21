// 실시간 시간 생성하는 파일

/** "2025년 11월 5일 (수)" 형식의 날짜 반환 */
export function formatKoreanDate(date) {
  // 문자열인 경우 Date 객체로 변환
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

/** "11:22:31" 형식의 시간 반환 */
export function formatKoreanTime(date) {
  // 문자열인 경우 Date 객체로 변환
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** 출퇴근 시간 표시용 "11:22" 형식의 시간 반환 */
export function formatTime(timeString) {
  if(!timeString) return "-";
  const date = new Date(timeString);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** 분 -> "44h 31m" 형식으로 변환 */
export function formatHM(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

/** "2025.11.21 11:22:31" 형식의 날짜/시간 반환 */
export function formatDateTime(date) {
  if (!date) return "-";
  // 문자열인 경우 Date 객체로 변환
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const seconds = String(dateObj.getSeconds()).padStart(2, "0");
  
  return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
}