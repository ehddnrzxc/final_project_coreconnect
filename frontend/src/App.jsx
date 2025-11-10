import React, { useState, useEffect, createContext } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Topbar from "./components/layout/Topbar";
import Sidebar from "./components/layout/Sidebar";
import { getMyProfileImage } from "./features/user/api/userAPI";
import {
  fetchUnreadCount,
  fetchDraftCount,
  fetchDraftbox,              // ← 이줄 추가!
  getUserEmailFromStorage
} from "./features/email/api/emailApi";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Box, CssBaseline } from "@mui/material";
import useAuth from "./hooks/useAuth";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

// Context for mail counts and refresh functions
export const MailCountContext = createContext();

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
  const [draftCount, setDraftCount] = useState(0);
  const navigate = useNavigate();

  // 받은메일함(안읽은)
  const refreshUnreadCount = async () => {
    const userEmail = getUserEmailFromStorage();
    if (!userEmail) return;
    const count = await fetchUnreadCount(userEmail);
    setUnreadCount(count || 0);
  };

  // 임시보관함(임시저장 개수)
  const refreshDraftCount = async () => {
    const userEmail = getUserEmailFromStorage();
    if (!userEmail) return setDraftCount(0);

    // 임시보관함 '목록' 조회를 통해 개수 얻음!
    const res = await fetchDraftbox(userEmail, 0, 1); // size=1로 최소만 받아오기
    const count =
      res?.data?.data?.totalElements !== undefined
        ? res.data.data.totalElements
        : 0;
    setDraftCount(count);
  };

  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // 프로필 이미지 로딩
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

  // 최초 마운트 시 개수 상태 동기화 (안읽은+임시보관)
  useEffect(() => {
    refreshUnreadCount();
    refreshDraftCount();
  }, []);

  // context value: count, set, refresh 함수
  const mailCountContextValue = {
    unreadCount, refreshUnreadCount,
    draftCount, refreshDraftCount,
    setAvatarUrl
  };

  return (
  <ThemeProvider theme={theme}>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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

        <MailCountContext.Provider value={mailCountContextValue}>
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
              <Outlet context={mailCountContextValue} />
            </Box>
          </Box>
        </MailCountContext.Provider>
      </Box>
    </LocalizationProvider>
  </ThemeProvider>
);
}

export default App;