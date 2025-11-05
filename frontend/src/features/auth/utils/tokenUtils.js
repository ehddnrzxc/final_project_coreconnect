/** localStorage에 Access Token 저장/조회/삭제를 담당하는 유틸 함수 모음 */

/**
 * Access Token 저장
 * 로그인 성공 시 서버로부터 받은 accessToken을 localStorage에 저장
 */
export const setAccessToken = (token) => {
  localStorage.setItem("accessToken", token);
};

/**
 * Access Token 조회
 * 저장된 accessToken 값을 가져옴 (없으면 null 반환)
 */
export const getAccessToken = () => {
  return localStorage.getItem("accessToken");
};

/**
 * Access Token 삭제
 * 로그아웃 시 localStorage에서 토큰 제거
 */
export const clearAccessToken = () => {
  localStorage.removeItem("accessToken");
};
