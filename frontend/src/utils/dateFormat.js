/**
 * ============================================================
 *    Date Format Utility (LocalDateTime ↔ ISO ↔ JS Date)
 * ------------------------------------------------------------
 * - Backend(LocalDateTime): "yyyy-MM-dd HH:mm:ss"
 * - Frontend(ISO):          "yyyy-MM-ddTHH:mm:ss"
 * - JS Date:                Date Object
 *
 *     Features
 *   - 모든 변환 간 일관된 포맷 보장
 *   - ISO ↔ LocalDateTime 상호 변환 자동
 *   - 잘못된 입력 방어 및 디버깅 모드 지원
 * ============================================================
 */

const pad = (n) => String(n).padStart(2, "0");
const DEBUG = false;

/** 내부 디버깅 로거 */
const log = (fn, input, output) => {
  if (DEBUG) console.log(`[${fn}] 입력:`, input, "→ 출력:", output);
};

/**
 * JS Date / ISO / LocalDateTime → 백엔드(LocalDateTime: "yyyy-MM-dd HH:mm:ss")
 */
export const toBackendFormat = (input) => {
  if (!input) return null;
  let result;

  // Date 객체
  if (input instanceof Date && !isNaN(input)) {
    const pad = (n) => String(n).padStart(2, "0");
    result = `${input.getFullYear()}-${pad(input.getMonth() + 1)}-${pad(
      input.getDate()
    )} ${pad(input.getHours())}:${pad(input.getMinutes())}:${pad(
      input.getSeconds()
    )}`;
  }

  // 문자열 ("T" or " " 모두 지원)
  else if (typeof input === "string") {
    let temp = input.includes("T") ? input.replace("T", " ") : input;

    // 초(:ss)가 없는 경우 자동으로 ":00" 추가
    // 예: "2025-11-07 11:00" → "2025-11-07 11:00:00"
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(temp)) {
      temp += ":00";
    }

    result = temp.trim();
  }

  // 기타 타입
  else {
    result = String(input);
  }

  return result;
};

/**
 * 백엔드(LocalDateTime or ISO) → ISO 포맷("yyyy-MM-ddTHH:mm:ss")
 * FullCalendar, input[type=datetime-local] 등에 사용
 */
export const toISO = (input) => {
  if (!input) return null;
  let result;

  // JS Date 객체
  if (input instanceof Date && !isNaN(input)) {
    result = input.toISOString().slice(0, 19); // UTC 기준
  }

  // 문자열 (" " or "T")
  else if (typeof input === "string") {
    result = input.includes("T")
      ? input.trim()
      : input.replace(" ", "T").trim();
  }

  // 기타
  else {
    result = String(input);
  }

  log("toISO", input, result);
  return result;
};

/**
 * ISO / LocalDateTime → datetime-local input 형식("yyyy-MM-ddThh:mm")
 * 타임존 오프셋과 초를 제거하여 datetime-local input에 맞게 변환
 */
export const toDateTimeLocal = (input) => {
  if (!input) return "";
  const iso = toISO(input);
  if (!iso) return "";
  
  // 타임존 오프셋 제거 (+09:00, -05:00 등)
  let result = iso.replace(/[+-]\d{2}:\d{2}$/, "");
  
  // 초(:ss) 제거 (datetime-local은 초를 표시하지 않음)
  result = result.replace(/:\d{2}$/, "");
  
  return result;
};

/**
 * datetime-local input 값 → LocalDateTime 형식("yyyy-MM-dd HH:mm:ss")
 * datetime-local input에서 받은 "yyyy-MM-ddThh:mm" 형식을 백엔드 형식으로 변환
 */
export const fromDateTimeLocal = (input) => {
  if (!input) return "";
  // "yyyy-MM-ddThh:mm" → "yyyy-MM-dd HH:mm:ss"
  return input.replace("T", " ") + ":00";
};

/**
 * 백엔드(LocalDateTime or ISO) → JS Date 객체 변환
 * DatePicker 초기값, 시간 계산 등에서 사용
 */
export const toDate = (input) => {
  if (!input) return null;
  try {
    const iso = toISO(input);
    const date = new Date(iso);
    if (isNaN(date)) throw new Error("Invalid date");
    log("toDate", input, date);
    return date;
  } catch (err) {
    console.error(`[toDate] 변환 실패:`, input, err);
    return null;
  }
};

/**
 * JS Date → ISO 문자열 ("yyyy-MM-ddTHH:mm:ss")
 * FullCalendar 수동 생성 시 사용
 */
export const toISOFromDate = (date) => {
  if (!(date instanceof Date) || isNaN(date)) return null;
  const result = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`;
  log("toISOFromDate", date, result);
  return result;
};


/**
 * LocalDateTime / ISO / JS Date → "yyyy-MM-dd" (LocalDate 전용)
 * 백엔드 @DateTimeFormat(pattern="yyyy-MM-dd")용 파라미터에 사용
 */
export const toLocalDate = (input) => {
  if (!input) return null;

  // Date 객체인 경우
  if (input instanceof Date && !isNaN(input)) {
    return `${input.getFullYear()}-${pad(input.getMonth() + 1)}-${pad(input.getDate())}`;
  }

  // 문자열인 경우 ("T" 또는 " " 포함)
  if (typeof input === "string") {
    const temp = input.includes("T") ? input.split("T")[0] : input.split(" ")[0];
    return temp;
  }

  // 기타 타입
  return String(input).slice(0, 10);
};