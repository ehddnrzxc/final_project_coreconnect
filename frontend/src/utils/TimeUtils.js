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
  
  try {
    let date;
    
    // ISO 8601 형식인 경우 (예: "2025-01-15T10:30:00" 또는 "2025-01-15T10:30:00+09:00")
    if (typeof timeString === 'string' && timeString.includes('T')) {
      // 시간대 정보가 없으면 한국 시간대(UTC+9)로 가정
      if (!timeString.includes('+') && !timeString.includes('Z') && !timeString.includes('-', 10)) {
        // "2025-01-15T10:30:00" 형식인 경우 한국 시간대로 해석
        date = new Date(timeString + '+09:00');
      } else {
        date = new Date(timeString);
      }
    } 
    // "yyyy-MM-dd HH:mm:ss" 형식인 경우 (예: "2025-01-15 10:30:00")
    else if (typeof timeString === 'string' && timeString.includes(' ')) {
      // 공백을 T로 변경하고 한국 시간대 추가
      const isoString = timeString.replace(' ', 'T') + '+09:00';
      date = new Date(isoString);
    }
    // 기타 형식
    else {
      date = new Date(timeString);
    }
    
    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
      console.warn('[formatTime] 잘못된 날짜 형식:', timeString);
      return "-";
    }
    
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('[formatTime] 날짜 파싱 오류:', error, 'timeString:', timeString);
    return "-";
  }
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