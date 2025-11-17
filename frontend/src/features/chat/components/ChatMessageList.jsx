import React from "react";
import { Box, Typography } from "@mui/material";

function ChatMessageList({ messages, userName }) {
  // 메시지가 하나도 없는 경우: "아직 메시지가 없습니다" 안내
  if (!messages || messages.length === 0) {
    return (
      <Box sx={{ mb: 2, minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography sx={{ color: "text.disabled", fontSize: 16, textAlign: "center" }}>
          아직 메시지가 없습니다.<br />
          메시지를 입력해 대화를 시작해보세요.
        </Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ mb: 2, minHeight: 320 }}>
      {messages.map((msg, idx) => (
        <Box
          key={msg.id ?? idx}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: msg.senderName === userName ? "flex-end" : "flex-start",
            mb: 1
          }}
        >
          <Box
            sx={{
              bgcolor: msg.senderName === userName ? "#ffe585" : "#f6f8fa",
              color: msg.senderName === userName ? "#1aaf54" : "#333",
              borderRadius: 2,
              px: 2,
              py: 1,
              maxWidth: 320,
              minWidth: 60,
              wordBreak: "break-all"
            }}
          >
            {msg.messageContent}
          </Box>
          <Typography sx={{ fontSize: 12, color: "#b0b6ce", ml: 1 }}>
            {msg.sendAt}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export default ChatMessageList;