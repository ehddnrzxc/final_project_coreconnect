import { Link, useNavigate } from "react-router-dom";
import Tooltip from "@mui/material/Tooltip";
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Button,
  Avatar,
  Badge,
  useTheme,
} from "@mui/material";
import MessageIcon from "@mui/icons-material/Message";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import NoticeModal from "../../../features/dashboard/components/NoticeModal";
import GroupwareNoticeModal from "../../../features/notice/components/GroupwareNoticeModal";
import { useState, useContext, useEffect } from "react";
import { jobGradeLabel } from "../../../utils/jobGradeUtils";
import { UserProfileContext } from "../../../App";
import { getUnreadNotificationSummary } from "../../../features/notification/api/notificationAPI";
import logoImage from "../../../assets/coreconnect-logo.png";
import NotificationPopover from "./components/NotificationPopover";
import ProfilePopover from "./components/ProfilePopover";
import ThemeSelect from "./components/ThemeSelect";
import SettingsDialog from "./settings/SettingsDialog";

export default function Topbar({ onLogout, themeMode, themeOptions, onThemeChange }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const { userProfile } = useContext(UserProfileContext) || {};
  const isAdmin = userProfile?.role === "ADMIN";

  // 프로필 이미지가 있을 때만 사용, 없으면 MUI Avatar 기본 아이콘 표시
  const avatarUrl =
    userProfile?.profileImageUrl && userProfile.profileImageUrl.trim() !== ""
      ? userProfile.profileImageUrl
      : undefined;

  const [noticeOpen, setNoticeOpen] = useState(false);
  const [groupwareNoticeOpen, setGroupwareNoticeOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState("overview");
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [unreadSummary, setUnreadSummary] = useState(null);

  const handleOpenNotice = async () => {
    setNoticeOpen(true);
  };

  const handleCloseNotice = () => {
    setNoticeOpen(false);
  };

  const handleOpenGroupwareNotice = () => {
    setGroupwareNoticeOpen(true);
  };

  const handleCloseGroupwareNotice = () => {
    setGroupwareNoticeOpen(false);
  };

  const handleAvatarClick = (e) => {
    setProfileAnchor(e.currentTarget);
  };

  const handleCloseProfile = () => {
    setProfileAnchor(null);
  };

  const handleOpenSettings = () => {
    setSettingsView("overview");
    setSettingsOpen(true);
    handleCloseProfile();
  };

  const handleCloseSettings = () => {
    setSettingsOpen(false);
    setSettingsView("overview");
  };

  const handleNotificationClick = (e) => {
    setNotificationAnchor(e.currentTarget);
  };

  const handleCloseNotification = () => {
    setNotificationAnchor(null);
  };

  useEffect(() => {
    // 주기적으로 알림 개수 갱신
    const interval = setInterval(() => {
      if (!notificationAnchor) {
        getUnreadNotificationSummary()
          .then(setUnreadSummary)
          .catch((err) => console.error("알림 요약 조회 실패:", err));
      }
    }, 30000); // 30초마다 갱신

    // 초기 로드
    getUnreadNotificationSummary()
      .then(setUnreadSummary)
      .catch((err) => console.error("알림 요약 조회 실패:", err));

    return () => clearInterval(interval);
  }, [notificationAnchor]);

  const displayedJobGrade = jobGradeLabel(userProfile?.jobGrade) || "";
  const displayedDept = userProfile?.deptName || "-";
  const displayedEmail = userProfile?.email || "";

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          color: "text.primary",
        }}
      >
        <Toolbar
          sx={{
            minHeight: 60,
            px: 2,
            display: "flex",
            justifyContent: "center",
            gap: 2,
          }}
        >
          {/* 왼쪽: 로고 */}
          <Box
            component={Link}
            to="/home"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              textDecoration: "none",
              color: "text.primary",
              mr: 2,
            }}
          >
            <Box
              component="img"
              src={logoImage}
              alt="코어커넥트 로고"
              sx={{
                height: 32,
                width: "auto",
                objectFit: "contain",
              }}
            />
            <Box
              component="span"
              sx={{
                typography: "h6",
                fontWeight: 500,
                letterSpacing: "-0.02em",
                fontFamily: '"Paperlogy", sans-serif',
                mt: -0.5,
              }}
            >
              코어커넥트
            </Box>
          </Box>

          {/* 가운데 여백 */}
          <Box sx={{ flex: 1 }} />

          {/* 검색 + 오른쪽 액션들 */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            {isAdmin && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<AdminPanelSettingsIcon />}
                onClick={() => navigate("/admin")}
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                }}
              >
                관리자 콘솔
              </Button>
            )}

            {/* 채팅 */}
            <Tooltip title="채팅" arrow>
              <IconButton
                size="small"
                onClick={() => navigate("/chat")}
                aria-label="Chat"
                sx={{ color: "text.primary" }}
              >
                <MessageIcon />
              </IconButton>
            </Tooltip>

            {/* 알림 */}
            <Tooltip title="알림" arrow>
              <IconButton
                size="small"
                onClick={handleNotificationClick}
                aria-label="Notifications"
                sx={{ color: "text.primary", position: "relative" }}
              >
                <Badge
                  badgeContent={unreadSummary?.unreadCount || 0}
                  color="error"
                  max={99}
                >
                  <NotificationsNoneIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* 공지사항 (그룹웨어) */}
            <Tooltip title="공지사항" arrow>
              <IconButton
                size="small"
                aria-label="공지사항"
                onClick={handleOpenGroupwareNotice}
                sx={{ color: "text.primary" }}
              >
                <CampaignOutlinedIcon />
              </IconButton>
            </Tooltip>

            {/* 테마 선택 */}
            <ThemeSelect
              themeMode={themeMode}
              themeOptions={themeOptions}
              onThemeChange={onThemeChange}
            />

            {/* 프로필 */}
            <Tooltip title="내 프로필" arrow>
              <IconButton
                size="small"
                onClick={handleAvatarClick}
                aria-label="내 프로필"
                sx={{ p: 0 }}
              >
                <Avatar
                  src={avatarUrl}
                  alt={userProfile?.name || "me"}
                  sx={{ width: 34, height: 34, ml: 0.5 }}
                />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 프로필 팝오버 */}
      <ProfilePopover
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={handleCloseProfile}
        avatarUrl={avatarUrl}
        userName={userProfile?.name}
        displayedJobGrade={displayedJobGrade}
        displayedDept={displayedDept}
        displayedEmail={displayedEmail}
        onOpenSettings={handleOpenSettings}
        onLogout={onLogout}
      />

      {/* 설정 다이얼로그 */}
      <SettingsDialog
        open={settingsOpen}
        onClose={handleCloseSettings}
        settingsView={settingsView}
        onViewChange={setSettingsView}
        avatarUrl={avatarUrl}
        userName={userProfile?.name}
        displayedDept={displayedDept}
        displayedJobGrade={displayedJobGrade}
        displayedEmail={displayedEmail}
        userProfile={userProfile}
        userEmail={userProfile?.email}
        theme={theme}
      />

      {/* 공지 모달 (게시판 공지사항) */}
      <NoticeModal open={noticeOpen} onClose={handleCloseNotice} />

      {/* 그룹웨어 공지사항 모달 */}
      <GroupwareNoticeModal open={groupwareNoticeOpen} onClose={handleCloseGroupwareNotice} />

      {/* 알림 팝오버 */}
      <NotificationPopover
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleCloseNotification}
      />
    </>
  );
}

