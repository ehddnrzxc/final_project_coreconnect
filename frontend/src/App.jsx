import React, { useState, useMemo, useEffect, createContext } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Topbar from "./components/layout/Topbar";
import Sidebar from "./components/layout/Sidebar";
import { getMyProfileInfo } from "./features/user/api/userAPI";
import {
  fetchUnreadCount,
  fetchDraftbox,
} from "./features/email/api/emailApi";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Box, CssBaseline } from "@mui/material";
import useAuth from "./hooks/useAuth";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// ----------- 채팅 컴포넌트 import 추가 -----------
import ChatHeaderIcon from "../src/features/chat/components/ChatHeaderIcon";
import ChatMain from "../src/features/chat/components/ChatMain";
import { getMyPendingApprovalCount } from "./features/dashboard/api/dashboardAPI";
// -----------------------------------------------

export const MailCountContext = createContext();
export const UserProfileContext = createContext(null);
export const ApprovalCountContext = createContext();

const themeOptions = {
  light: {
    name: "라이트",
    palette: {
      mode: "light",
      primary: { main: "#08a7bf" },
      background: { default: "#f5f5f5", paper: "#ffffff", secondary: "#f5f5f5" },
      divider: "rgba(0, 0, 0, 0.12)",
    },
  },
  dark: {
    name: "다크",
    palette: {
      mode: "dark",
      primary: { main: "#08a7bf" },
      background: { default: "#121212", paper: "#1e1e1e", secondary: "#2d2d2d" },
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
      primary: { main: "#ec4899" },
      background: { default: "#fdd3efff", paper: "#ffffff", secondary: "#fce4f0" },
      divider: "rgba(0, 0, 0, 0.12)",
    },
  },
  blue: {
    name: "블루",
    palette: {
      mode: "light",
      primary: { main: "#1976d2" },
      background: { default: "#e3f2fd", paper: "#ffffff", secondary: "#e1eff9" },
      divider: "rgba(0, 0, 0, 0.12)",
    },
  },
  green: {
    name: "그린",
    palette: {
      mode: "light",
      primary: { main: "#2e7d32" },
      background: { default: "#e8f5e9", paper: "#ffffff", secondary: "#e1f5e4" },
      divider: "rgba(0, 0, 0, 0.12)",
    },
  },

};

function App() {
  const [userProfile, setUserProfile] = useState(null);

  const [unreadCount, setUnreadCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const navigate = useNavigate();

  // ------------ 채팅 오픈 상태 추가 -------------
  const [chatOpen, setChatOpen] = useState(false);
  // --------------------------------------------

  // 결재 대기 개수 상태
  const [approvalCount, setApprovalCount] = useState(0);

  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem("themeMode");
    return saved && themeOptions[saved] ? saved : "light";
  });

  const theme = useMemo(() => {
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
    const userEmail = userProfile?.email;
    if (!userEmail) return;
    const count = await fetchUnreadCount(userEmail);
    setUnreadCount(count || 0);
  };

  // 임시보관함(임시저장 개수)
  const refreshDraftCount = async () => {
    const userEmail = userProfile?.email;
    if (!userEmail) return setDraftCount(0);

    // 임시보관함 '목록' 조회를 통해 개수 얻음!
    const res = await fetchDraftbox(userEmail, 0, 1); // size=1로 최소만 받아오기
    const count =
      res?.data?.data?.totalElements !== undefined
        ? res.data.data.totalElements
        : 0;
    setDraftCount(count);
  };

  const refreshApprovalCount = async () => {
    const userEmail = userProfile?.email;
    if (!userEmail) return;
    try {
      const count = await getMyPendingApprovalCount();
      setApprovalCount(count || 0);
    } catch (e) {
      console.warn("결재 대기 개수 조회 실패:", e);
    }
  }

  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // 프로필 정보 로딩
  useEffect(() => {
    (async () => {
      try {
        const profileData = await getMyProfileInfo();
        setUserProfile(profileData);
      } catch (e) {
        console.warn("프로필 정보 불러오기 실패:", e);
      }
    })();
  }, []);

  // 최초 마운트 시 개수 상태 동기화 (안읽은+임시보관)
  useEffect(() => {
    if (userProfile?.email) {
      refreshUnreadCount();
      refreshDraftCount();
      refreshApprovalCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.email]);

  // context value: count, set, refresh 함수
  const mailCountContextValue = {
    unreadCount, refreshUnreadCount,
    draftCount, refreshDraftCount,
  };

  const approvalCountContextValue = { approvalCount, refreshApprovalCount };

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        <UserProfileContext.Provider value={{ userProfile, setUserProfile }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
              bgcolor: "background.default",
            }}
          >
            {/* ----------- Topbar(채팅아이콘 추가) ------------ */}
            <Topbar 
              onLogout={handleLogout}
              themeMode={themeMode}
              themeOptions={themeOptions}
              onThemeChange={handleThemeChange}
              rightExtra={
                <ChatHeaderIcon onClick={() => setChatOpen(true)} />
              }
            />
            {/* ----------------------------------------------- */}
            {/* MailCountContext Provider */}
            <MailCountContext.Provider value={mailCountContextValue}>
              <ApprovalCountContext.Provider value={approvalCountContextValue}>
                <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
                  <Sidebar />
                  <Box
                    component="main"
                    sx={{
                      flex: 1,
                      minHeight: 0,
                      display: "flex",
                      flexDirection: "column",
                      bgcolor: "background.default",
                    }}
                  >
                    <Outlet context={{ refreshUnreadCount }} />
                  </Box>
                </Box>
              </ApprovalCountContext.Provider>
            </MailCountContext.Provider>

            {/* ---------- 채팅 패널(오버레이) ---------- */}
            {chatOpen && (
              <ChatMain onClose={() => setChatOpen(false)} />
            )}
            {/* ---------------------------------------- */}
          </Box>
        </UserProfileContext.Provider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;