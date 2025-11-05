/** 로그인된 사용자 정보를 localStorage에서 불러오고, 그 사용자가 관리자(Admin)인지 판별하기 위한 파일 */

/**
 * 로그인된 사용자 정보를 localStorage에서 불러옴
 * 로그인 시 저장된 'user' JSON 문자열을 파싱
 * 없거나 파싱 실패 시 null 반환
 */
export function getAuthUser() {
  try {
    const raw = localStorage.getItem("user"); 
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * 현재 사용자가 관리자(Admin) 권한인지 여부 확인
 * user.role 값이 "Admin"이면 true 반환
 * 로그인이 안되어있거나 권한이 다르면 false 반환 
 */
export function isAdmin() {
  const user = getAuthUser();
  return user?.role === "ADMIN";
}
