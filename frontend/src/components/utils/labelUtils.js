export const JOB_GRADE_LABELS = {
  INTERN: "인턴",
  STAFF: "사원",
  ASSISTANT_MANAGER: "대리",
  MANAGER: "과장",
  DEPUTY_GENERAL_MANAGER: "차장",
  GENERAL_MANAGER: "부장",
  DIRECTOR: "이사",
  EXECUTIVE_DIRECTOR: "상무",
  VICE_PRESIDENT: "전무",
  PRESIDENT: "대표"
};

export const LEAVE_REQUEST_LABELS = {
  PENDING: "대기",
  APPROVED: "승인",
  REJECTED: "반려",
  CANCELED: "취소",
};

export const LEAVE_TYPE_LABELS = {
  ANNUAL: "연차",
  HALF_DAY_MORNING: "반차(오전)",
  HALF_DAY_AFTERNOON: "반차(오후)",
  SICK: "병가",
  FAMILY_EVENT: "경조휴가",
  ETC: "기타",
};

export const getLeaveTypeLabel = (value) => {
  return LEAVE_TYPE_LABELS[value] || value;
};

export const NOTIFICATION_TYPE_LABELS = {
  EMAIL: "메일",
  NOTICE: "공지",
  APPROVAL: "결재",
  SCHEDULE: "일정",
};

export const getJobGradeLabel = key => JOB_GRADE_LABELS[key] || key;
export const getLeaveRequestLabel = key => LEAVE_REQUEST_LABELS[key] || key;
export const getNotificationTypeLabel = type => NOTIFICATION_TYPE_LABELS[type] || "알림";

