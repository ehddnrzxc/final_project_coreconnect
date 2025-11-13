import React, { useState, useEffect, createContext } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Topbar from "./components/layout/Topbar";
import Sidebar from "./components/layout/Sidebar";
import { getMyProfileImage } from "./features/user/api/userAPI";
import {
  fetchUnreadCount,
  fetchDraftbox,
  getUserEmailFromStorage
} from "./features/email/api/emailApi";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Box, CssBaseline } from "@mui/material";
import useAuth from "./hooks/useAuth";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { SnackbarProvider } from "./components/utils/SnackbarContext";

export const MailCountContext = createContext();

const themeOptions = {
  light: {
    name: "라이트",
    palette: {
      mode: "light",
      primary: { main: "#08a7bf" },
      background: { default: "#ffffff", paper: "#f5f5f5" },
    },
  },
  dark: {
    name: "다크",
    palette: {
      mode: "dark",
      primary: { main: "#08a7bf" },
      background: { default: "#121212", paper: "#1e1e1e" },
      text: {
        primary: "rgba(255, 255, 255, 0.87)",
        secondary: "rgba(255, 255, 255, 0.6)",
      },
      divider: "rgba(255, 255, 255, 0.12)",
    },
  },
  pink: {
    name: "핑크",
    palette: {
      mode: "light",
      primary: { main: "#08a7bf" },
      background: { default: "#fdd3efff", paper: "#ffffff" },
    },
  },
  blue: {
    name: "블루",
    palette: {
      mode: "light",
      primary: { main: "#1976d2" },
      background: { default: "#e3f2fd", paper: "#ffffff" },
    },
  },
  green: {
    name: "그린",
    palette: {
      mode: "light",
      primary: { main: "#2e7d32" },
      background: { default: "#e8f5e9", paper: "#ffffff" },
    },
  },

};

function App() {
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const DEFAULT_AVATAR = "https://i.pravatar.cc/80?img=12";
  const [avatarUrl, setAvatarUrl] = useState(storedUser.imageUrl || DEFAULT_AVATAR);

  const [unreadCount, setUnreadCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const navigate = useNavigate();

  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem("themeMode");
    return saved && themeOptions[saved] ? saved : "light";
  });

  const theme = React.useMemo(() => {
    const selectedTheme = themeOptions[themeMode];
    return createTheme({
      palette: {
        ...selectedTheme.palette,
      },
      typography: {
        fontFamily:
        '"Noto Sans KR", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
    });
  }, [themeMode]);

  // 테마 변경 함수
  const handleThemeChange = newTheme => {
    if (themeOptions[newTheme]) {
      setThemeMode(newTheme);
      localStorage.setItem("themeMode", newTheme);
    }
  };

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
        <SnackbarProvider>
          <CssBaseline />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
              bgcolor: "background.default",
            }}
          >
            <Topbar 
              onLogout={handleLogout} 
              avatarUrl={avatarUrl}
              themeMode={themeMode}
              themeOptions={themeOptions}
              onThemeChange={handleThemeChange}
            />
            <MailCountContext.Provider value={mailCountContextValue}>
              <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
                {/* Sidebar는 Provider 내부에서 context 사용, undefined 안전 처리됨 */}
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
                  <Outlet context={{ setAvatarUrl, refreshUnreadCount }} />
                </Box>
              </Box>
            </MailCountContext.Provider>
          </Box>
        </SnackbarProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;