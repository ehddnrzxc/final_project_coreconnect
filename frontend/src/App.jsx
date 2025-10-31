import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Topbar from "./components/layout/Topbar";
import Sidebar from "./components/layout/Sidebar";
import "./app.css";
import { getMyProfileImage } from "./api/userAPI";

function App() {

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [avatarUrl, setAvatarUrl] = useState(
    storedUser.imageUrl || "https://i.pravatar.cc/80?img=12"
  );

  const navigate = useNavigate();

  const onLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    navigate("/login"); // 로그인 페이지로 이동
  };

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      try {
        const url = await getMyProfileImage();          
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const updated = { ...user, imageUrl: url || "" };
        localStorage.setItem("user", JSON.stringify(updated));
        setAvatarUrl(updated.imageUrl || "https://i.pravatar.cc/80?img=12");
      } catch (_) {}
    })();
  }, []);

  return (
    <div className="app">
      <Topbar onLogout={onLogout} avatarUrl={avatarUrl}/>
      <div className="layout">
        <Sidebar />
        {/* 여기서 자식 라우트(HomePage 등)가 렌더링됨 */}
        <main className="content">
          {/* HomePage에 setter 전달 */}
          <Outlet context={{ setAvatarUrl }}/>
        </main>
      </div>
    </div>
  );
}

export default App;