/** 로그인 상태를 관리하고 로그아웃 기능을 제공하기 위한 커스텀 훅
 *  로그인 여부를 토큰 유무로 판단하고, 그 결과를 isLoggedIn 상태로 관리하는 훅 
 */

import { useState, useEffect } from "react";
import { logout as logoutApi } from "../features/auth/api/authAPI"

export default function useAuth() {
  // 처음 로드 시 localStorage에 user가 있으면 로그인 상태로 간주
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return !!stored;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    setIsLoggedIn(!!stored);
  }, []);

  const logout = async () => {
    try {
      // 서버에서 로그아웃 요청해서 access_token / refresh_token 쿠키 제거
      await logoutApi();
    } catch (e) {
      console.error("로그아웃 API 호출 실패:", e);
    }
    localStorage.removeItem("user");
    setIsLoggedIn(false);
  };

  return { isLoggedIn, setIsLoggedIn, logout };
}
