import React from "react";
import { Box, Typography, Link, Avatar } from "@mui/material";

const isImageFile = (url = "") => {
  if (!url) return false;
  const cleanUrl = url.split("?")[0].toLowerCase();
  return /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(cleanUrl);
};

const formatTime = (time) => {
  if (!time) return "";
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return time;
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
};

const MessageBubble = ({ children, isMine }) => (
  <Box
    sx={{
      bgcolor: isMine ? "#ffe585" : "#f6f8fa",
      borderRadius: 2,
      px: 2,
      py: 1.2,
      maxWidth: 380,
      minWidth: 120,
      wordBreak: "break-word",
      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.03)",
    }}
  >
    {children}
  </Box>
);

function ChatMessageList({ messages, userName, roomType = "group" }) {
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
      {messages.map((msg, idx) => {
        const isMine = msg.senderName === userName;
        const displayName = msg.senderName || (isMine ? userName || "나" : "상대방");

        const content = (
          <MessageBubble isMine={isMine}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {msg.messageContent && (
                <Typography sx={{ color: isMine ? "#1aaf54" : "#333" }}>
                  {msg.messageContent}
                </Typography>
              )}
              {msg.fileYn && msg.fileUrl && (
                isImageFile(msg.fileUrl) ? (
                  <Box
                    component="img"
                    src={msg.fileUrl}
                    alt="첨부 이미지"
                    sx={{
                      width: "100%",
                      maxWidth: 280,
                      borderRadius: 1.5,
                      border: "1px solid #e1e4eb",
                      objectFit: "cover"
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      bgcolor: "#fff",
                      border: "1px solid #d7dce6",
                      borderRadius: 1.5,
                      px: 1.5,
                      py: 0.8
                    }}
                  >
                    <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5, color: "#4b4f61" }}>
                      첨부 파일
                    </Typography>
                    <Link
                      href={msg.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                      sx={{ fontSize: 13, wordBreak: "break-all", color: "#007fff" }}
                    >
                      {decodeURIComponent(msg.fileUrl.split("/").pop()?.split("?")[0] || "파일 다운로드")}
                    </Link>
                  </Box>
                )
              )}
            </Box>
          </MessageBubble>
        );

        if (isMine) {
          return (
            <Box
              key={msg.id ?? idx}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                mb: 2,
                textAlign: "right",
              }}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#1aaf54", mb: 0.5 }}>
                {displayName}
              </Typography>
              {content}
              <Typography sx={{ fontSize: 12, color: "#b0b6ce", mt: 0.5 }}>
                {formatTime(msg.sendAt)}
              </Typography>
            </Box>
          );
        }

        return (
          <Box
            key={msg.id ?? idx}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
              mb: 2,
            }}
          >
            <Avatar
              sx={{
                bgcolor: "#10c16d",
                width: 36,
                height: 36,
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              {displayName?.[0]?.toUpperCase() || "?"}
            </Avatar>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1f2a44", mb: 0.5 }}>
                {displayName}
                {roomType === "group" && msg.senderTitle ? ` (${msg.senderTitle})` : ""}
              </Typography>
              {content}
              <Typography sx={{ fontSize: 12, color: "#b0b6ce", mt: 0.5 }}>
                {formatTime(msg.sendAt)}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

export default ChatMessageList;