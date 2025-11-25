// 실시간 시간 생성하는 파일

/** "2025년 11월 5일 (수)" 형식의 날짜 반환 (한국 시간 기준) */
export function formatKoreanDate(date) {
  if (!date) return "-";
  try {
    // 문자열인 경우 Date 객체로 변환
    let dateObj = date instanceof Date ? date : new Date(date);
    
    // 한국 시간으로 변환
    const koreaTimeStr = dateObj.toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
    dateObj = new Date(koreaTimeStr);
    
    return dateObj.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      timeZone: 'Asia/Seoul'
    });
  } catch (error) {
    console.error('[formatKoreanDate] 에러:', error, date);
    return "-";
  }
}

/** "11:22:31" 형식의 시간 반환 (한국 시간 기준) */
export function formatKoreanTime(date) {
  if (!date) return "-";
  try {
    // 문자열인 경우 Date 객체로 변환
    let dateObj = date instanceof Date ? date : new Date(date);
    
    // 한국 시간으로 변환
    const koreaTimeStr = dateObj.toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
    dateObj = new Date(koreaTimeStr);
    
    return dateObj.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: 'Asia/Seoul'
    });
  } catch (error) {
    console.error('[formatKoreanTime] 에러:', error, date);
    return "-";
  }
}

/** 출퇴근 시간 표시용 "11:22" 형식의 시간 반환 (한국 시간 기준) */
export function formatTime(timeString) {
  if(!timeString) return "-";
  
  try {
    let date;
    const dateStr = String(timeString);
    
    // ISO 8601 형식인 경우 (서버에서 "2025-11-25T00:42:00" 형식으로 보냄)
    if (dateStr.includes('T')) {
      // 타임존 정보가 없으면 한국 시간(UTC+9)으로 간주하여 파싱
      if (!dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.match(/-\d{2}:\d{2}$/)) {
        // "2025-11-25T00:42:00" 형식을 한국 시간으로 파싱
        const [datePart, timePart] = dateStr.split('T');
        const [year, month, day] = datePart.split('-');
        const [timeOnly] = (timePart || '').split('.');
        const [hour, minute, second = '00'] = (timeOnly || '').split(':');
        
        // UTC로 Date 객체 생성 후 한국 시간(UTC+9)으로 변환
        date = new Date(Date.UTC(
          parseInt(year, 10),
          parseInt(month, 10) - 1,
          parseInt(day, 10),
          parseInt(hour, 10),
          parseInt(minute, 10),
          parseInt(second, 10)
        ));
        // 한국 시간은 UTC+9이므로 9시간을 빼서 UTC로 변환
        date = new Date(date.getTime() - (9 * 60 * 60 * 1000));
      } else {
        date = new Date(dateStr);
      }
    } 
    // "yyyy-MM-dd HH:mm:ss" 형식인 경우 (예: "2025-01-15 10:30:00")
    else if (dateStr.includes(' ')) {
      // 공백을 T로 변경하고 한국 시간대 추가
      const isoString = dateStr.replace(' ', 'T') + '+09:00';
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
    
    // 한국 시간으로 변환하여 포맷팅
    const koreaTimeStr = date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
    const koreaTime = new Date(koreaTimeStr);
    const hours = String(koreaTime.getHours()).padStart(2, "0");
    const minutes = String(koreaTime.getMinutes()).padStart(2, "0");
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

/** "2025.11.21 11:22:31" 형식의 날짜/시간 반환 (한국 시간 기준) */
export function formatDateTime(date) {
  if (!date) return "-";
  try {
    // 문자열인 경우 Date 객체로 변환
    let dateObj = date instanceof Date ? date : new Date(date);
    
    // 한국 시간으로 변환
    const koreaTimeStr = dateObj.toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
    dateObj = new Date(koreaTimeStr);
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const seconds = String(dateObj.getSeconds()).padStart(2, "0");
    
    return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('[formatDateTime] 에러:', error, date);
    return "-";
  }
}