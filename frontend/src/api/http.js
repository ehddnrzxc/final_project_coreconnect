/** 
 * http.js
 * 
 * axios를 공통 설정 + 공통 로직을 한 곳에서 관리하기 위해서 분리한 파일.
 * baseURL, 헤더, 토큰 처리, 에러 처리 등을 중복해서 할 필요가 없습니다.
 */

import axios from "axios";

const http = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
});

// localStorage나 SessionStorage에 토큰을 저장할 때 사용할 키 이름을 통일하기 위한 상수 처리
const ACCESS_TOKEN_KEY = "accessToken";

// 요청 인터셉터: 모든 API 요청에 자동으로 JWT 토큰을 붙여주는 기능
http.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 동시 요청 방지를 위한 제어 로직
let isRefreshing = false; // 토큰 재발급 요청 중인지 여부를 표시하는 플래그
let waiters = []; // refresh 요청이 끝날 때까지 기다리는 요청들을 저장하는 배열

// refresh 요청이 끝나서 새로운 Access Token을 받으면 waiters 배열 안에 대기 중이던 콜백들을 실행
function onRefreshed(newToken) {
  waiters.forEach((cb) => cb(newToken));
  waiters = [];
}

/** 
 * 응답 인터셉터
 * 401(토큰 만료) -> refresh 요청 -> 새 토큰 저장 -> 원래 요청 재시도
 * 동시에 여러 401이 발생하면 한 번만 refresh 실행, 나머지는 대기 후 재시도
 */
http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error;
    if (!response) throw error;

    // refresh 호출 자체가 401 나면 더 진행 X
    if (config?.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    // 최초 401 -> refresh 시도
    if (response.status === 401 && !config._retry) {
      config._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          // refresh 엔드포인트는 인증 없이 허용되어 있어야 함 (SecurityConfig 확인)
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

      // 이미 refresh 중이면 refresh 완료까지 대기 -> 새 토큰으로 재시도
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

