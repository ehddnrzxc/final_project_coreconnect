import { Link, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Button,
  Avatar,
  Typography,
  TextField,
  InputAdornment,
} from "@mui/material";
import MessageIcon from "@mui/icons-material/Message";
import RedeemIcon from "@mui/icons-material/Redeem";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SearchIcon from "@mui/icons-material/Search";
import coreconnectLogo from "../../assets/coreconnect-logo.png";

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
