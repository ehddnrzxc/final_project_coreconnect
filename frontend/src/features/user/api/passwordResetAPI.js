import http from "../../../api/http";

// 비밀번호 초기화 요청 생성
export async function createPasswordResetRequest({ email, name, reason }) {
  const res = await http.post("/password-reset/requests", {
    email,
    name,
    reason,
  });
  return res.data;
}