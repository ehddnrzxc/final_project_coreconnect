  import http from "../../../api/http";

  /** 특정 일정의 참여자 목록 조회 */
  export const getParticipantsBySchedule = async (scheduleId) => {
    try {
      const res = await http.get(`/scheduleParticipants`, { params: { scheduleId } });
      const data = res.data;
      // 2중 배열 방지 + 빈 응답 안전 처리
      return Array.isArray(data) ? data : data ? [data] : [];
    } catch (err) {
      const message = err.response?.data || "참여자 목록 조회 중 오류가 발생했습니다.";
      throw new Error(message);
    }
  };

  /** 참여자 추가 (단건) */
  export const addParticipant = async (data) => {
    try {
      const res = await http.post(`/scheduleParticipants`, data);
      return res.data;
    } catch (err) {
      const message = err.response?.data || "참여자 추가 중 오류가 발생했습니다.";
      throw new Error(message);
    }
  };

  /** 참여자 삭제 */
  export const deleteParticipant = async (id) => {
    try {
      const res = await http.delete(`/scheduleParticipants/${id}`);
      return res.data;
    } catch (err) {
      const message = err.response?.data || "참여자 삭제 중 오류가 발생했습니다.";
      throw new Error(message);
    }
  };