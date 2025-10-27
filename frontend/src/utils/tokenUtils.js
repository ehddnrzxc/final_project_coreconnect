// src/utils/tokenUtils.js

// Access Token 저장
export const setAccessToken = (token) => {
  localStorage.setItem("accessToken", token);
};

// Access Token 가져오기
export const getAccessToken = () => {
  return localStorage.getItem("accessToken");
};

// Access Token 삭제 (로그아웃 시)
export const clearAccessToken = () => {
  localStorage.removeItem("accessToken");
};
