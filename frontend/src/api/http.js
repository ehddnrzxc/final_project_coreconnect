/** 
 * http.js
 * 
 * axios를 공통 설정 + 공통 로직을 한 곳에서 관리하기 위해서 분리한 파일.
 * Access Token / Refresh Token 모두 HttpOnly 쿠키로 관리하므로 프론트에서 토큰을 직접 다루지 않습니다.
 */

import axios from "axios";

const http = axios.create({
  baseURL: "http://localhost:8080/api/v1/",
  withCredentials: true,
});

// 동시 요청 방지를 위한 제어 로직
let isRefreshing = false; // 토큰 재발급 요청 중인지 여부를 표시하는 플래그
let waiters = []; // refresh 요청이 끝날 때까지 기다리는 요청들을 저장하는 배열

// refresh 요청이 끝나서 새로운 Access Token을 받으면 waiters 배열 안에 대기 중이던 콜백들을 실행
function onRefreshed() {
  waiters.forEach((cb) => cb());
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
    if (!response) return Promise.reject(error);

    // refresh 호출 자체가 401 나면 더 진행 X (로그인 필요)
    if (config?.url?.includes("/auth/refresh")) {
      console.warn("[HTTP] Refresh 토큰 만료 또는 유효하지 않음. 로그인이 필요합니다.");
      // 로그인 페이지로 리다이렉트 (필요시)
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    // 최초 401 -> refresh 시도
    if (response.status === 401 && !config._retry) {
      config._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          console.log("[HTTP] 401 에러 발생, 토큰 갱신 시도...");
          await http.post("/auth/refresh", {});
          console.log("[HTTP] 토큰 갱신 성공, 원래 요청 재시도");
          isRefreshing = false;
          onRefreshed();
          return http(config);
        } catch (e) {
          console.error("[HTTP] 토큰 갱신 실패:", e);
          isRefreshing = false;
          waiters = [];
          // refresh 실패 시 로그인 페이지로 리다이렉트
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
          return Promise.reject(e);
        }
      }

      // 이미 refresh 중이면 refresh 완료까지 대기 -> 새 토큰으로 재시도
      return new Promise((resolve, reject) => {
        waiters.push(() => {
          http(config).then(resolve).catch(reject);
        });
      });
    }
    return Promise.reject(error);
  }
);

export default http;

