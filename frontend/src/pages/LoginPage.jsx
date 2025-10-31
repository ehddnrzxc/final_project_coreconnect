import React from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import useAuth from "../hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useAuth();

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    navigate("/home");
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>코어커넥트 로그인</h2>
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
}
