// 실시간 시간 생성하는 파일

/** "2025년 11월 5일 (수)" 형식의 날짜 반환 */
export function formatKoreanDate(date) {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

/** "11:22:31" 형식의 시간 반환 */
export function formatKoreanTime(date) {
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// 출퇴근 시간 표시용 "11:22" 형식의 시간 반환
export function formatTime(timeString) {
  if(!timeString) return "-";
  const date = new Date(timeString);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}