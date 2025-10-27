import axios from "axios";

const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
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

    // 리프레시에 다시 리프레시 걸리지 않게 가드
    if (config?.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    if (response.status === 401 && !config._retry) {
      config._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const r = await http.post("/auth/refresh", {});
          const newAccess = r.data.accessToken;
          localStorage.setItem("accessToken", newAccess);

          // ✅ 원요청 헤더를 새 토큰으로 갱신 후 재시도
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${newAccess}`;

          onRefreshed(newAccess);
          return http(config);
        } catch (e) {
          waiters = [];
          localStorage.removeItem("accessToken");
          return Promise.reject(e);
        } finally {
          isRefreshing = false;
        }
      }

      // 리프레시 진행 중이면 대기 -> 토큰 받으면 재시도
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
