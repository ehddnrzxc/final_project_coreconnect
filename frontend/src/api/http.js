// src/api/http.js
import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
  withCredentials: true,
});

// ── 공통: 토큰 키 통일 (accessToken 만 사용)
const ACCESS_TOKEN_KEY = "accessToken";

// 요청 인터셉터: Authorization 자동 부착
http.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 처리 상태
let isRefreshing = false;
let waiters = [];

function onRefreshed(newToken) {
  waiters.forEach((cb) => cb(newToken));
  waiters = [];
}

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error;
    if (!response) throw error;

    // refresh 호출 자체가 401 나면 더 진행 X
    if (config?.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    // 최초 401 → refresh 시도
    if (response.status === 401 && !config._retry) {
      config._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          // 🔁 refresh 엔드포인트는 인증 없이 허용되어 있어야 함 (SecurityConfig 확인)
          const r = await http.post("/auth/refresh", {});
          const newAccess = r.data?.accessToken;
          if (!newAccess) throw new Error("No accessToken in refresh response");

          localStorage.setItem(ACCESS_TOKEN_KEY, newAccess);

          // 1) 현재 재시도 요청 헤더 갱신
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${newAccess}`;

          // 2) 이후 요청들 기본 헤더도 갱신
          http.defaults.headers.common.Authorization = `Bearer ${newAccess}`;

          onRefreshed(newAccess);
          return http(config);
        } catch (e) {
          waiters = [];
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          return Promise.reject(e);
        } finally {
          isRefreshing = false;
        }
      }

      // 이미 refresh 중이면 refresh 완료까지 대기 → 새 토큰으로 재시도
      return new Promise((resolve) => {
        waiters.push((token) => {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
          resolve(http(config));
        });
      });
    }

    return Promise.reject(error);
  }
);

export default http;
export const TOKEN_KEY = ACCESS_TOKEN_KEY;
