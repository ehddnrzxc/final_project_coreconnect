import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Topbar from "./components/layout/Topbar";
import Sidebar from "./components/layout/Sidebar";
import { getMyProfileImage } from "./features/user/api/userAPI";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Box, CssBaseline } from "@mui/material";
import useAuth from "./hooks/useAuth";

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
  const navigate = useNavigate();

  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login"); 
  };

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      try {
        const url = await getMyProfileImage();          
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        // 기존 user 정보에 이미지 url 추가 
        const updated = { ...user, imageUrl: url || "" };
        localStorage.setItem("user", JSON.stringify(updated));
        setAvatarUrl(updated.imageUrl || DEFAULT_AVATAR);
      } catch (e) {
        console.error("프로필 이미지 불러오기 실패:", e);
      }
    })();
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
        <Topbar onLogout={handleLogout} avatarUrl={avatarUrl} />

        <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
          <Sidebar />
          <Box
            component="main"
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Outlet context={{ setAvatarUrl }} />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
export default App;