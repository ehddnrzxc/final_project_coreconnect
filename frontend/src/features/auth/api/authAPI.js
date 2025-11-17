/**
 * 로그인, 로그아웃, 토큰 재발급 등 인증 전용 HTTP 요청을 담당하는 모듈.
 * http.js - axios 기본 세팅(토큰 자동첨부, 401 처리 등)
 * authAPI.js - 인증 관련 API 함수 모음
 */

import http from "../../../api/http";

// 로그인
export async function login(email, password) {
  const { data } = await http.post(
    "/auth/login",
    { email, password },
    { withCredentials: true } // ★ 추가
  );
  return data;
}

// 로그아웃
export async function logout() {
  await http.post("/auth/logout", {}, { withCredentials: true }); // ★ 추가
}


// 액세스 재발급
export async function refreshAccessToken() {
  const { data } = await http.post(
    "/auth/refresh",
    {},
    { withCredentials: true } // ★ 추가
  );
  return data;
}

