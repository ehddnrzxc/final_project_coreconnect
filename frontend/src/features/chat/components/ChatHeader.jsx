import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import PersonIcon from "@mui/icons-material/Person";

// 채팅 헤더(상단바)
function ChatHeader() {
  return (
    <Box className="chat-header" sx={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: "56px", background: "#fff", borderBottom: "1px solid #f0f1f4",
      px: 3, gap: 2
    }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <PersonIcon sx={{ fontSize: 26, color: "#10c16d" }} />
        <Typography sx={{ fontSize: 20, fontWeight: 600, color: "#222" }}>
          채팅
        </Typography>
      </Box>
      <Box sx={{
        display: "flex", alignItems: "center", gap: 2,
        fontSize: 22, color: "#bbb"
      }}>
        <IconButton><NotificationsNoneIcon /></IconButton>
        <IconButton><PersonIcon /></IconButton>
      </Box>
    </Box>
  );
}
export default ChatHeader;