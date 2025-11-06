/** 로그인 상태를 관리하고 로그아웃 기능을 제공하기 위한 커스텀 훅
 *  로그인 여부를 토큰 유무로 판단하고, 그 결과를 isLoggedIn 상태로 관리하는 훅 
 */

import { useState, useEffect } from "react";
import { getAccessToken, clearAccessToken } from "../features/auth/utils/tokenUtils";

export default function useAuth() {
  // 토큰이 있으면 isLoggedIn = true, 없으면 false
  const [isLoggedIn, setIsLoggedIn] = useState(!!getAccessToken());

  useEffect(() => {
    const token = getAccessToken();
    setIsLoggedIn(!!token);
  }, []);

  const logout = () => {
    clearAccessToken();
    setIsLoggedIn(false);
  };

  return { isLoggedIn, setIsLoggedIn, logout };
}
