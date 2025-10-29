// src/utils/authUtils.js
export function getAuthUser() {
  try {
    const raw = localStorage.getItem("user"); // 로그인 시 저장했던 user 정보
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAdmin() {
  const user = getAuthUser();
  return user?.role === "ADMIN";
}
