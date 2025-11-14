import { Link, useNavigate } from "react-router-dom";
import Tooltip from "@mui/material/Tooltip";
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Button,
  Avatar,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Popover,
  Divider,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  useTheme,
  List,
  ListItemButton,
  ListItemText,
  Stack
} from "@mui/material";
import PaletteIcon from "@mui/icons-material/Palette";
import MessageIcon from "@mui/icons-material/Message";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SearchIcon from "@mui/icons-material/Search";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import NoticeModal from "../../features/dashboard/components/NoticeModal";
import { useMemo, useState, useContext } from "react";
import { jobGradeLabel } from "../../utils/jobGradeUtils";
import { UserProfileContext } from "../../App";
import logoImage from "../../assets/coreconnect-logo.png";

const Topbar = ({ onLogout, themeMode, themeOptions, onThemeChange }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const userProfile = useContext(UserProfileContext);
  const isAdmin = userProfile?.role === "ADMIN";
  
  const DEFAULT_AVATAR = "https://i.pravatar.cc/80?img=12";
  const avatarUrl = userProfile?.profileImageUrl || DEFAULT_AVATAR;

  const [noticeOpen, setNoticeOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState("overview");

  const handleOpenNotice = async () => {
    setNoticeOpen(true);
  };

  const handleCloseNotice = () => {
    setNoticeOpen(false);
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

  const displayedJobGrade = jobGradeLabel(userProfile?.jobGrade) || "";
  const displayedDept = userProfile?.deptName || "-";
  const displayedEmail = userProfile?.email || "";

  const leftMenuItems = useMemo(
    () => [
      { key: "overview", label: "내 정보 관리" },
      { key: "preferences", label: "환경설정" },
      { key: "security", label: "보안설정" },
      { key: "notifications", label: "알림설정" },
    ],
    []
  );

  const renderOverview = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        내 정보 관리
      </Typography>
      <Box
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <List disablePadding>
          <ListItemButton onClick={() => setSettingsView("profileDetail")}
            sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.5 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              내 프로필 관리
            </Typography>
            <Typography variant="body2" color="text.secondary">
              사용자의 프로필을 관리합니다.
            </Typography>
          </ListItemButton>
          <Divider />
          <ListItemButton
            sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.5 }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              약관 및 서비스 정책
            </Typography>
            <Typography variant="body2" color="text.secondary">
              코어커넥트의 약관 및 서비스 정책을 확인합니다.
            </Typography>
          </ListItemButton>
        </List>
      </Box>
    </Box>
  );

  const renderProfileDetail = () => (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <IconButton size="small" onClick={() => setSettingsView("overview")}
          sx={{ border: `1px solid ${theme.palette.divider}` }}>
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <Typography variant="h5" fontWeight={700}>
          내 프로필 관리
        </Typography>
      </Stack>

      <Box
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          p: 3,
          maxWidth: 540,
        }}
      >
        <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 3 }}>
          <Avatar src={avatarUrl} alt={userProfile?.name}
            sx={{ width: 72, height: 72 }} />
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {userProfile?.name || "-"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {displayedDept} · {displayedJobGrade || "직급 정보 없음"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {displayedEmail}
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={2}>
          {[
            { label: "회사이름", value: "코어커넥트" },
            { label: "아이디/이메일", value: `${userProfile?.email || "-"}` },
            { label: "직책·부서", value: displayedDept },
            { label: "직급", value: displayedJobGrade || "-" },
            { label: "휴대전화", value: userProfile?.phone || "-" },
          ].map((item) => (
            <Box key={item.label} sx={{ display: "flex", gap: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ width: 110 }}>
                {item.label}
              </Typography>
              <Typography variant="body2">{item.value}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );

  const activeViewContent = settingsView === "profileDetail" ? renderProfileDetail() : renderOverview();

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
            gap: 1.5,
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
          <Typography
            variant="h6"
            sx={{
              fontWeight: 500,
              letterSpacing: "-0.02em",
              fontFamily: '"Paperlogy", sans-serif',
            }}
          >
            코어커넥트
          </Typography>
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
          <Box sx={{ width: 280 }}>
            <TextField size="small"
                       fullWidth
                       placeholder="검색어를 입력하세요"
                       InputProps={{ startAdornment: (
                         <InputAdornment position="start">
                         <SearchIcon fontSize="small" />
                         </InputAdornment> ),
                       }}
                       sx={{
                         "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "#e5e7eb", },
                         "&:hover fieldset": { borderColor: "#e5e7eb", },
                         "&.Mui-focused fieldset": { borderColor: "#00a0e9", }, },
                       }} />
          </Box>
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
            <IconButton size="small"
                        aria-label="Notifications"
                        sx={{ color: "text.primary" }}>
              <NotificationsNoneIcon />
            </IconButton>
          </Tooltip>

          {/* 공지사항 */}
          <Tooltip title="공지사항" arrow>
            <IconButton size="small"
                        aria-label="Gifts"
                        onClick={handleOpenNotice}
                        sx={{ color: "text.primary" }}>
              <CampaignOutlinedIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="테마 변경" arrow>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={themeMode}
                onChange={(e) => onThemeChange(e.target.value)}
                sx={{
                  height: 36,
                  fontSize: "0.875rem",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e5e7eb",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e5e7eb",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#00a0e9",
                  },
                }}
                startAdornment={
                  <Box sx={{ display: "flex", alignItems: "center", mr: 1}}>
                    <PaletteIcon sx={{ fontSize: 18, color: "text.secondary", mr: 0.5 }} />
                  </Box>
                }
              >
                {themeOptions && Object.entries(themeOptions).map(([key, theme]) => (
                  <MenuItem key={key} value={key}>
                    {theme.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Tooltip>

          <Tooltip title="내 프로필" arrow>
            <IconButton size="small" onClick={handleAvatarClick}
              aria-label="내 프로필" sx={{ p: 0 }}>
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
    <Popover
      open={Boolean(profileAnchor)}
      anchorEl={profileAnchor}
      onClose={handleCloseProfile}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      PaperProps={{ sx: { borderRadius: 3, width: 280, p: 2, boxShadow: 4 } }}
    >
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <IconButton size="small" onClick={handleCloseProfile}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 1 }}>
        <Avatar src={avatarUrl} alt={userProfile?.name} sx={{ width: 64, height: 64 }} />
        <Typography variant="subtitle1" fontWeight={700}>
          {userProfile?.name || "사용자"}
          {displayedJobGrade ? ` ${displayedJobGrade}` : ""}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {displayedDept}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {displayedEmail}
        </Typography>
      </Box>
      <Stack direction="row" justifyContent="center" spacing={4} sx={{ mt: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
          <IconButton
            onClick={handleOpenSettings}
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: "rgba(15,23,42,0.05)",
              "&:hover": {
                bgcolor: "rgba(15,23,42,0.08)",
              },
            }}
          >
            <SettingsIcon />
          </IconButton>
          <Typography variant="caption">설정</Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
          <IconButton
            onClick={() => {
              handleCloseProfile();
              onLogout?.();
            }}
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: "rgba(15,23,42,0.05)",
              "&:hover": {
                bgcolor: "rgba(15,23,42,0.08)",
              },
            }}
          >
            <LogoutIcon />
          </IconButton>
          <Typography variant="caption">로그아웃</Typography>
        </Box>
      </Stack>
    </Popover>

    {/* 설정 다이얼로그 */}
    <Dialog
      open={settingsOpen}
      onClose={handleCloseSettings}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: 4,
          minHeight: 520,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 4,
          pt: 3,
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          설정
        </Typography>
        <IconButton onClick={handleCloseSettings}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: "flex", px: 0, pb: 0 }}>
        <Box
          sx={{
            width: 220,
            borderRight: `1px solid ${theme.palette.divider}`,
            minHeight: 440,
          }}
        >
          <List>
            {leftMenuItems.map((item) => (
              <ListItemButton
                key={item.key}
                selected={item.key === settingsView || (item.key === "overview" && settingsView === "profileDetail")}
                onClick={() => setSettingsView(item.key === "overview" ? "overview" : item.key)}
              >
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
              </ListItemButton>
            ))}
          </List>
        </Box>
        <Box sx={{ flex: 1, minHeight: 440 }}>{activeViewContent}</Box>
      </DialogContent>
    </Dialog>

    {/* 공지 모달 */}
    <NoticeModal open={noticeOpen} onClose={handleCloseNotice} />
  </>
  );
};

export default Topbar;
