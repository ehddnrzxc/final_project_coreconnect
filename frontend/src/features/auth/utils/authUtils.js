/** 로그인된 사용자 정보를 서버 API로 불러오고, 그 사용자가 관리자(Admin)인지 판별하기 위한 파일 */

import { getMyProfileInfo } from "../../user/api/userAPI";

// 사용자 정보 캐시 (API 호출 최소화)
let cachedUser = null;
let cachePromise = null;

/**
 * 로그인된 사용자 정보를 서버 API로 불러옴
 * 캐시를 사용하여 중복 호출 방지
 * 없거나 파싱 실패 시 null 반환
 */
export async function getAuthUser() {
  // 캐시가 있으면 즉시 반환
  if (cachedUser !== null) {
    return cachedUser;
  }

  // 이미 진행 중인 요청이 있으면 그 요청을 재사용
  if (cachePromise) {
    return cachePromise;
  }

  // 새 요청 시작
  cachePromise = (async () => {
    try {
      const user = await getMyProfileInfo();
      cachedUser = user;
      return user;
    } catch (error) {
      // 401 또는 기타 에러 시 null 반환
      cachedUser = null;
      return null;
    } finally {
      cachePromise = null;
    }
  })();

  return cachePromise;
}

/**
 * 현재 사용자가 관리자(Admin) 권한인지 여부 확인
 * user.role 값이 "ADMIN"이면 true 반환
 * 로그인이 안되어있거나 권한이 다르면 false 반환
 * 비동기 함수로 변경됨
 */
export async function isAdmin() {
  const user = await getAuthUser();
  return user?.role === "ADMIN";
}

/**
 * 사용자 정보 캐시를 초기화하는 함수
 * 로그아웃 시 또는 로그인 시 호출하여 캐시를 초기화
 */
export function clearAuthCache() {
  cachedUser = null;
  cachePromise = null;
}
