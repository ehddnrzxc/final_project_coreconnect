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
  InputLabel,
} from "@mui/material";
import PaletteIcon from "@mui/icons-material/Palette";
import MessageIcon from "@mui/icons-material/Message";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SearchIcon from "@mui/icons-material/Search";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import NoticeModal from "../../features/dashboard/pages/NoticeModal";
import { useState } from "react";


const Topbar = ({ onLogout, avatarUrl, themeMode, themeOptions, onThemeChange }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "ADMIN";

  const [noticeOpen, setNoticeOpen] = useState(false);

  const handleOpenNotice = async () => {
    setNoticeOpen(true);
  };

  const handleCloseNotice = () => {
    setNoticeOpen(false);
  };

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
            gap: 1,                        
            textDecoration: "none",
            color: "primary.main",
            fontSize: 20,
            fontWeight: 700,
            mr: 2,
          }}
        >
          CoreConnect
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
              sx={{ color: "#000" }}
            >
              <MessageIcon />
            </IconButton>
          </Tooltip>

          {/* 알림 */}
          <Tooltip title="알림" arrow>
            <IconButton size="small"
                        aria-label="Notifications"
                        sx={{ color: "#000" }}>
              <NotificationsNoneIcon />
            </IconButton>
          </Tooltip>

          {/* 공지사항 */}
          <Tooltip title="공지사항" arrow>
            <IconButton size="small"
                        aria-label="Gifts" 
                        onClick={handleOpenNotice}
                        sx={{ color: "#000" }}>
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

          {avatarUrl && (
            <Avatar
              src={avatarUrl}
              alt="me"
              sx={{ width: 32, height: 32, ml: 0.5 }}
            />
          )}

          <Button
            size="small"
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={onLogout}
            sx={{ textTransform: "none" }}
          >
            로그아웃
          </Button>
        </Box>
      </Toolbar>
    </AppBar>

    {/* 공지 모달 */}
    <NoticeModal open={noticeOpen} onClose={handleCloseNotice} />
  </>
  );
};

export default Topbar;
