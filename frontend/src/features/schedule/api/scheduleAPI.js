import http from "../../../api/http";
import { toBackendFormat } from "../../../utils/dateFormat";

/** 일정 생성 (POST) */
export const createSchedule = async (data) => {
  
  const payload = {
    ...data,
    startDateTime: toBackendFormat(data.startDateTime),
    endDateTime: toBackendFormat(data.endDateTime),
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

  const payload = {
    ...data,
    startDateTime: toBackendFormat(data.startDateTime),
    endDateTime: toBackendFormat(data.endDateTime),
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
export const getMySchedules = () =>
  http.get("/schedules/me").then((res) => res.data);

/** 내 일정 조회(일간) */
export const getMyTodaySchedules = () =>
  http.get("/schedules/me/today").then((res) => res.data);

/** 단일 일정 조회 */
export const getScheduleById = (id) =>
  http.get(`/schedules`, { params: { id } }).then((res) => res.data);

/** 카테고리 전체 조회 */
export const getScheduleCategories = () =>
  http.get("/scheduleCategories").then((res) => res.data);

/** 사용자 목록 조회 (초대용) */
export const getUsers = () =>
  http.get("/users").then((res) => res.data);

/** 회의실 전체 조회 */
export const getMeetingRooms = () =>
  http.get("/meetingRooms").then((res) => res.data);

/** 회의실 예약 가능 여부 검사 */
export const checkRoomAvailable = (id, start, end) =>
  http
    .get(`/meetingRooms/availability`, {
      params: { id, start: toBackendFormat(start), end: toBackendFormat(end) },
    })
    .then((res) => res.data);