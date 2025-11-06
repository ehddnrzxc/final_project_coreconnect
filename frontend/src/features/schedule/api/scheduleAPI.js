import http from "../../../api/http";
import { toBackendFormat } from "../../../utils/dateFormat";

/** 일정 생성 (POST) */
export const createSchedule = async (data) => {
  // 날짜 형식 백엔드에 맞게 변환
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

/** 단일 일정 조회 */
export const getScheduleById = (id) =>
  http.get(`/schedules`, { params: { id } }).then((res) => res.data);

/** 회의실 일정 조회 */
export const getSchedulesByMeetingRoom = (meetingRoomId) =>
  http.get(`/schedules`, { params: { meetingRoomId } }).then((res) => res.data);
