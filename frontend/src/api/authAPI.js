// src/api/Auth.api.js (또는 authAPI.js)
import http from "./http";

// 로그인
export async function login(email, password) {
  const { data } = await http.post("/auth/login", { email, password });
  return data; // { accessToken, user }
}

// 액세스 재발급
export async function refreshAccessToken() {
  const { data } = await http.post("/auth/refresh", {}); // 쿠키 자동 포함
  return data; // { accessToken }
}

// 로그아웃
export async function logout() {
  await http.post("/auth/logout", {}); // 쿠키 자동 포함
}