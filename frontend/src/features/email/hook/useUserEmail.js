import { useContext } from "react";
import { UserProfileContext } from "../../../App"; // 경로는 실제 위치에 맞춰 수정

/**
 * 사용자 이메일을 편리하게 가져오는 커스텀 훅
 * - UserProfileContext에서 email 값을 안전하게 추출
 * - user가 직렬화된 문자열 또는 객체일 수 있으므로 모두 처리
 * @returns {string|null} user.email 값 또는 null
 */
/**
 * 사용자 이메일을 반환하는 커스텀 훅
 */
/**
 * 사용자 이메일 반환 커스텀 훅 (Provider가 value={{ userProfile, setUserProfile }} 구조일 때)
 */
export default function useUserEmail() {
  const context = useContext(UserProfileContext);

  // 컨텍스트가 null이거나, userProfile이 아직 null이면 null 반환 (로딩 중)
  if (!context || !context.userProfile) return null;

  // userProfile에 email이 있으면 반환
  return context.userProfile.email || null;
}

export function useUserEmailFromContext() {
  const user = useContext(UserProfileContext);
  if (!user) return null;
  if (typeof user === "string") {
    try {
      const userObj = JSON.parse(user);
      return userObj.email || null;
    } catch { return null; }
  }
  if (typeof user === "object" && user !== null) {
    return user.email || null;
  }
  return null;
}
