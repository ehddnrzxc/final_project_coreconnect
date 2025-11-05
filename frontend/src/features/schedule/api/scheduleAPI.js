import http from "../../../api/http";
import { toBackendFormat, toISO } from "../../../utils/dateFormat";

/** 내 일정 조회 (백엔드: /api/v1/schedules/me) */
export const getMySchedules = () =>
  http.get("/schedules/me").then((res) => res.data);

/** 일정 생성 (POST, @AuthenticationPrincipal 기반) */
export const createSchedule = (data) => {
  // 날짜 형식 백엔드에 맞게 변환
  const payload = {
    ...data,
    startDateTime: toBackendFormat(data.startDateTime),
    endDateTime: toBackendFormat(data.endDateTime),
  };
  return http.post("/schedules", payload).then((res) => res.data);
};

/** 일정 수정 */
export const updateSchedule = (id, data) => {
  const payload = {
    ...data,
    startDateTime: toBackendFormat(data.startDateTime),
    endDateTime: toBackendFormat(data.endDateTime),
  };
  return http.put(`/schedules/${id}`, payload).then((res) => res.data);
};

/** 일정 삭제 */
export const deleteSchedule = (id) =>
  http.delete(`/schedules/${id}`).then((res) => res.data);

/** 단일 일정 조회 */
export const getScheduleById = (id) =>
  http.get(`/schedules`, { params: { id } }).then((res) => res.data);

/** 회의실 일정 조회 */
export const getSchedulesByMeetingRoom = (meetingRoomId) =>
  http.get(`/schedules`, { params: { meetingRoomId } }).then((res) => res.data);
