import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  withCredentials: true, // 쿠키 쓰면 유지, 아니면 상관없음
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // 디버깅 도움: 토큰이 없으면 로그로 확인
    console.warn("[HTTP] No token in localStorage (token/accessToken).");
  }
  return config;
});

export default http;
