import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Avatar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MessageIcon from '@mui/icons-material/Message';
import RedeemIcon from "@mui/icons-material/Redeem";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

const Topbar = ({ onLogout, avatarUrl }) => {

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "ADMIN";

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        color: "text.primary",
      }}
    >
      <Toolbar
        sx={{
          minHeight: 60,
          px: 2,
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        {/* 검색 */}
        <Box sx={{ flex: 1, maxWidth: 420 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="검색어를 입력하세요"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#e5e7eb",     
                },
                "&:hover fieldset": {
                  borderColor: "#e5e7eb",    
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#00a0e9",    
                },
              },
            }}
          />
        </Box>

        {/* 오른쪽 액션들 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
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

          <IconButton
            size="small"
            onClick={() => navigate("/chat")}
            aria-label="Chat"
          >
            <MessageIcon />
          </IconButton>

          <IconButton size="small" aria-label="Gifts">
            <RedeemIcon />
          </IconButton>

          <IconButton size="small" aria-label="Notifications">
            <NotificationsNoneIcon />
          </IconButton>

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
  );
};

export default Topbar;