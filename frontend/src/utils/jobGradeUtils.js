export const jobGradeLabel = (code) => {
  const map = {
    INTERN: "인턴",
    STAFF: "사원",
    ASSISTANT_MANAGER: "대리",
    MANAGER: "과장",
    DEPUTY_GENERAL_MANAGER: "차장",
    GENERAL_MANAGER: "부장",
    DIRECTOR: "이사",
    EXECUTIVE_DIRECTOR: "상무",
    VICE_PRESIDENT: "전무",
    PRESIDENT: "대표",
  };
  return map[code] || code;
};
