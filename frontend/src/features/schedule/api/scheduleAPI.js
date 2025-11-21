import http from "../../../api/http";
import { toBackendFormat, toLocalDate } from "../../../utils/dateFormat";

/** 일정 생성 (POST) */
export const createSchedule = async (data) => {
  const normalizedStart = toBackendFormat(data.startDateTime);
  const normalizedEnd = toBackendFormat(data.endDateTime);
  
  if (!normalizedStart || !normalizedEnd) {
    throw new Error("시작 시간 또는 종료 시간 형식이 올바르지 않습니다.");
  }
  
  const payload = {
    ...data,
    startDateTime: normalizedStart,
    endDateTime: normalizedEnd,
  };
  try {
    const res = await http.post("/schedules", payload);
    return res.data;
  } catch (err) {
    const message = err.response?.data || "일정 등록 중 오류가 발생했습니다.";
    throw new Error(message);
  }
};

/** 일정 수정 */
export const updateSchedule = async (id, data) => {
  const normalizedStart = toBackendFormat(data.startDateTime);
  const normalizedEnd = toBackendFormat(data.endDateTime);
  
  if (!normalizedStart || !normalizedEnd) {
    throw new Error("시작 시간 또는 종료 시간 형식이 올바르지 않습니다.");
  }
  
  const payload = {
    ...data,
    startDateTime: normalizedStart,
    endDateTime: normalizedEnd,
  };
  try {
    const res = await http.put(`/schedules/${id}`, payload);
    return res.data;
  } catch (err) {
    const message = err.response?.data || "일정 수정 중 오류가 발생했습니다.";
    throw new Error(message);
  }
};

/** 일정 삭제 */
export const deleteSchedule = async (id) => {
  try {
    const res = await http.delete(`/schedules/${id}`);
    return res.data;
  } catch (err) {
    const message = err.response?.data || "일정 삭제 중 오류가 발생했습니다.";
    throw new Error(message);
  }
};

/** 내 일정 조회 */
export const getMySchedules = async () => {
  try {
    const res = await http.get("/schedules/me");
    return res.data;
  } catch (err) {
    const message = err.response?.data || "일정을 불러올 수 없습니다.";
    throw new Error(message);
  }
};

/** 내 일정 조회(일간) */
export const getMyTodaySchedules = async () => {
  try {
    const res = await http.get("/schedules/me/today");
    return res.data;
  } catch (err) {
    const message = err.response?.data || "오늘 일정을 불러올 수 없습니다.";
    throw new Error(message);
  }
};

/** 여러 유저의 일정 현황 조회
 *  - 백엔드 컨트롤러가 date 또는 start/end 를 받도록 되어 있으니,
 *    여기서는 start/end 가 넘어오면 그것으로 보내고,
 *    없으면 date(yyyy-MM-dd) 로 보낸다.
 */
export const getUsersAvailability = async (userIds, startOrDate, maybeEnd, scheduleId = null) => {
  try {
    const params = { userIds: userIds.join(",") }; // Spring List<Integer> 매핑용 "1,2,3"

    if (maybeEnd) {
      // 시간 구간(시작/종료)으로 조회
      const normalizedStart = toBackendFormat(startOrDate);
      const normalizedEnd = toBackendFormat(maybeEnd);
      
      if (!normalizedStart || !normalizedEnd) {
        throw new Error("시작 시간 또는 종료 시간 형식이 올바르지 않습니다.");
      }
      
      params.start = normalizedStart;
      params.end = normalizedEnd;
    } else {
      // 하루 단위(date) 조회 - toLocalDate 유틸리티 사용으로 일관성 확보
      const pureDate = toLocalDate(startOrDate);
      if (!pureDate) {
        throw new Error("날짜 형식이 올바르지 않습니다.");
      }
      params.date = pureDate;
    }

    // 수정 모드일 때 자기 자신의 일정은 제외
    if (scheduleId) {
      params.scheduleId = scheduleId;
    }

    const res = await http.get("/schedules/availability", { params });
    return res.data; // { 6: [...], 7: [...] }
  } catch (err) {
    const message =
      err.response?.data || err.message || "참석자 일정 현황 조회 중 오류가 발생했습니다.";
    throw new Error(message);
  }
};

/** 단일 일정 조회 */
export const getScheduleById = async (id) => {
  try {
    const res = await http.get(`/schedules`, { params: { id } });
    return res.data;
  } catch (err) {
    const message = err.response?.data || "일정을 불러올 수 없습니다.";
    throw new Error(message);
  }
};

/** 카테고리 전체 조회 */
export const getScheduleCategories = async () => {
  try {
    const res = await http.get("/scheduleCategories");
    return res.data;
  } catch (err) {
    const message = err.response?.data || "카테고리를 불러올 수 없습니다.";
    throw new Error(message);
  }
};

/** 카테고리 생성 */
export const createScheduleCategory = async (data) => {
  try {
    const res = await http.post("/scheduleCategories", data);
    return res.data;
  } catch (err) {
    const message =
      err.response?.data || "카테고리 생성 중 오류가 발생했습니다.";
    throw new Error(message);
  }
};

/** 카테고리 이름 수정 */
export const updateScheduleCategory = async (id, data) => {
  try {
    const res = await http.put(`/scheduleCategories/${id}`, data);
    return res.data;
  } catch (err) {
    const message =
      err.response?.data || "카테고리 수정 중 오류가 발생했습니다.";
    throw new Error(message);
  }
};

/** 카테고리 삭제 */
export const deleteScheduleCategory = async (id) => {
  try {
    const res = await http.delete(`/scheduleCategories/${id}`);
    return res.data;
  } catch (err) {
    const message =
      err.response?.data || "카테고리 삭제 중 오류가 발생했습니다.";
    throw new Error(message);
  }
};

/** 사용자 목록 조회 (초대용) - 조직도 API 사용 */
export const getUsers = async () => {
  try {
    const res = await http.get("/user/organization");
    // 조직도 API 응답을 기존 로직과 호환되도록 매핑
    // OrganizationUserResponseDTO: { userId, name, email, deptName, positionName }
    // 기존 로직이 기대하는 형태: { id, name, email, deptName }
    return res.data.map(user => ({
      id: user.userId,  // userId → id로 변환
      name: user.name,
      email: user.email,
      deptName: user.deptName || "소속 없음"  // 부서 정보 포함
    }));
  } catch (err) {
    const message = err.response?.data || "사용자 목록을 불러올 수 없습니다.";
    throw new Error(message);
  }
};

/** 회의실 전체 조회 */
export const getMeetingRooms = async () => {
  try {
    const res = await http.get("/meetingRooms");
    return res.data;
  } catch (err) {
    const message = err.response?.data || "회의실 목록을 불러올 수 없습니다.";
    throw new Error(message);
  }
}

/** 회의실 예약 가능 여부 검사 */
export const checkRoomAvailable = async (id, start, end, scheduleId = null) => {
  try {
    const normalizedStart = toBackendFormat(start);
    const normalizedEnd = toBackendFormat(end);
    
    if (!normalizedStart || !normalizedEnd) {
      throw new Error("시작 시간 또는 종료 시간 형식이 올바르지 않습니다.");
    }
    
    const params = { id, start: normalizedStart, end: normalizedEnd };
    // 수정 모드일 때 자기 자신의 일정은 제외
    if (scheduleId) {
      params.scheduleId = scheduleId;
    }
    const res = await http.get(`/meetingRooms/availability`, { params });
    return res.data;
  } catch (err) {
    const message = err.response?.data || err.message || "회의실 예약 가능 여부를 확인할 수 없습니다.";
    throw new Error(message);
  }
};

/** 특정 시간대 예약 가능한 회의실 조회 */
export const getAvailableMeetingRooms = async (start, end, scheduleId = null) => {
  try {
    const normalizedStart = toBackendFormat(start);
    const normalizedEnd = toBackendFormat(end);
    
    if (!normalizedStart || !normalizedEnd) {
      throw new Error("시작 시간 또는 종료 시간 형식이 올바르지 않습니다.");
    }
    
    const params = { start: normalizedStart, end: normalizedEnd };
    if (scheduleId) params.scheduleId = scheduleId;
    
    const res = await http.get("/meetingRooms/available", { params });
    return res.data.availableRooms;
  } catch (err) {
    const message = err.response?.data || err.message || "예약 가능한 회의실을 불러올 수 없습니다.";
    throw new Error(message);
  }
};