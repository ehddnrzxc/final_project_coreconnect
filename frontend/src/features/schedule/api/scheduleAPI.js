import http from "../../../api/http";

// 일정 전체 조회 (로그인된 사용자 기준)
export const getMySchedules = () =>
  http.get("/schedules").then(res => res.data);

// 일정 생성
export const createSchedule = (data) =>
  http.post("/schedules", data).then(res => res.data);

// 일정 상세 조회
export const getScheduleById = (id) =>
  http.get(`/schedules/${id}`).then(res => res.data);

// 일정 수정
export const updateSchedule = (id, data) =>
  http.put(`/schedules/${id}`, data).then(res => res.data);

// 일정 삭제
export const deleteSchedule = (id) =>
  http.delete(`/schedules/${id}`).then(res => res.data);