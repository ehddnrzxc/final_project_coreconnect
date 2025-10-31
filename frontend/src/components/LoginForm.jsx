import React, { useState } from "react";
import { login } from "../api/authAPI";
import { setAccessToken } from "../utils/tokenUtils";
import "../login.css";
import { getMyProfileImage } from "../api/userAPI";

export default function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  // 비밀번호 표시 여부 상태 추가
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, pw);
      setAccessToken(data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user)); 
      onLoginSuccess?.();

      // 로그인 직후 서버에서 프로필 이미지 재조회
      const imageUrl = await getMyProfileImage();
      const nextUser = { ...(JSON.parse(localStorage.getItem("user") || "{}")), imageUrl: imageUrl || "" };
      localStorage.setItem("user", JSON.stringify(nextUser));
    } catch(e) {
      console.error("로그인 실패:", e);
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <input type="text" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} />
      <div className="password-wrapper">
        <input
          type={showPw ? "text" : "password"}
          placeholder="비밀번호"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />

        {pw.length > 0 && (
          <button
            type="button"
            className="toggle-pw-btn"
            onClick={() => setShowPw((prev) => !prev)}
            aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"}
          >
            <i className={`fa-regular ${showPw ? "fa-eye-slash" : "fa-eye"}`} />
          </button>
        )}
      </div>
      {error && <div className="error-msg">{error}</div>}
      <button type="submit" className="login-btn">로그인</button>
    </form>
  );
}
