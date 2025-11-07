  import http from "../../../api/http";

  /** 특정 일정의 참여자 목록 조회 */
  export const getParticipantsBySchedule = (scheduleId) =>
    http.get(`/scheduleParticipants`, { params: { scheduleId } }).then((res) => res.data);

  /** 참여자 추가 (단건) */
  export const addParticipant = (data) =>
    http.post(`/scheduleParticipants`, data).then((res) => res.data);

  /** 참여자 삭제 */
  export const deleteParticipant = (id) =>
    http.delete(`/scheduleParticipants/${id}`).then((res) => res.data);