/**
 * - 백엔드(LocalDateTime) ↔ 프론트(JS Date/ISO) 자동 변환
 * - LocalDateTime: "yyyy-MM-dd HH:mm:ss"
 * - ISO Format:    "yyyy-MM-ddTHH:mm:ss"
 *
 * 사용 예시:
 *   toBackendFormat("2025-11-05T09:00:00") → "2025-11-05 09:00:00"
 *   toISO("2025-11-05 09:00:00")           → "2025-11-05T09:00:00"
 *   toBackendFormat(new Date())             → "2025-11-05 09:00:00"
 */

const pad = (n) => String(n).padStart(2, "0");

/** 디버그 모드: 콘솔에 변환 과정을 출력 (기본 false) */
const DEBUG = false;

/**
 * JS → 백엔드(LocalDateTime) 포맷 변환
 * 지원:
 *   - Date 객체
 *   - ISO 문자열 ("2025-11-05T09:00:00")
 *   - LocalDateTime 문자열 ("2025-11-05 09:00:00")
 */
export const toBackendFormat = (input) => {
  if (!input) return null;

  let result;

  // 1) Date 객체 처리
  if (input instanceof Date) {
    result = `${input.getFullYear()}-${pad(input.getMonth() + 1)}-${pad(
      input.getDate()
    )} ${pad(input.getHours())}:${pad(input.getMinutes())}:${pad(
      input.getSeconds()
    )}`;
  }
  // 2) 문자열(ISO or LocalDateTime)
  else if (typeof input === "string") {
    // ISO 형태("T" 포함) → " "으로 변환
    if (input.includes("T")) {
      result = input.replace("T", " ");
    } else {
      // 이미 " " 형태면 그대로 반환
      result = input;
    }
  } else {
    result = String(input);
  }

  if (DEBUG)
    console.log(`[toBackendFormat] 입력: ${input} → 출력: ${result}`);
  return result;
};

/**
 * 백엔드(LocalDateTime or ISO) → JS ISO 문자열
 * 즉, FullCalendar나 input[type=datetime-local]에 맞는 포맷으로 변환
 */
export const toISO = (input) => {
  if (!input) return null;

  let result;

  // 1) Date 객체
  if (input instanceof Date) {
    result = input.toISOString().slice(0, 19); // yyyy-MM-ddTHH:mm:ss
  }
  // 2) 문자열
  else if (typeof input === "string") {
    // 이미 ISO면 그대로 반환
    if (input.includes("T")) {
      result = input;
    } else {
      // LocalDateTime 문자열 (" ") → ISO ("T")로 변환
      result = input.replace(" ", "T");
    }
  } else {
    result = String(input);
  }

  if (DEBUG) console.log(`[toISO] 입력: ${input} → 출력: ${result}`);
  return result;
};

/**
 * 백엔드(LocalDateTime or ISO) → JS Date 객체 변환
 * 예: DB 데이터로 DatePicker 초기값 지정 시 사용
 */
export const toDate = (input) => {
  if (!input) return null;
  try {
    const isoString = toISO(input);
    const dateObj = new Date(isoString);
    if (DEBUG) console.log(`[toDate] 입력: ${input} → Date: ${dateObj}`);
    return dateObj;
  } catch (e) {
    console.error("날짜 변환 실패:", input, e);
    return null;
  }
};
