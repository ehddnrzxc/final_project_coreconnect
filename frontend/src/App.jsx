import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Topbar from "./components/layout/Topbar";
import Sidebar from "./components/layout/Sidebar";
import { getMyProfileImage } from "./features/user/api/userAPI";
import { fetchUnreadCount, getUserEmailFromStorage } from "./features/email/api/emailApi";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Box, CssBaseline } from "@mui/material";

const theme = createTheme({
  palette: {
    primary: { main: "#08a7bf" },
    background: { default: "#ffffff" },
  },
  typography: {
    fontFamily:
      '"Noto Sans KR", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});

function App() {
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const DEFAULT_AVATAR = "https://i.pravatar.cc/80?img=12";
  const [avatarUrl, setAvatarUrl] = useState(storedUser.imageUrl || DEFAULT_AVATAR);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const refreshUnreadCount = async () => {
    const userEmail = getUserEmailFromStorage();
    if (!userEmail) return;
    const count = await fetchUnreadCount(userEmail);
    setUnreadCount(count || 0);
  };

  const onLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    navigate("/login"); 
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
        setAvatarUrl(updated.imageUrl || DEFAULT_AVATAR);
      } catch (e) {
        console.error("프로필 이미지 불러오기 실패:", e);
      }
    })();
  }, []);

  useEffect(() => {
    refreshUnreadCount();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          bgcolor: "background.default",
        }}
      >
        <Topbar onLogout={onLogout} avatarUrl={avatarUrl} />
        <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* 사이드바에 unreadCount와 refreshUnreadCount 전달 */}
          <Sidebar unreadCount={unreadCount} refreshUnreadCount={refreshUnreadCount} />
          <Box
            component="main"
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Outlet 하위 페이지에서 context로 refreshUnreadCount 사용 */}
            <Outlet context={{ setAvatarUrl, refreshUnreadCount }} />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
export default App;