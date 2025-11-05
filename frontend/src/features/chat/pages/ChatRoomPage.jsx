import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, TextField, Button, IconButton } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import SendIcon from "@mui/icons-material/Send";

/**
 * 
해당 roomId로 채팅방 진입
상태관리(useState, useEffect)
WebSocket 연결/해제
채팅 메시지 input/form & 전송
실시간 수신/표시 처리
 */
function getUserName() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.name || "";
  } catch {
    return "";
  }
}

const WEBSOCKET_BASE = "ws://localhost:8080/ws/chat";

export default function ChatRoomPage() {
  const { roomId } = useParams(); // URL에서 roomId 추출(예: /chat/room/26)
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [socket, setSocket] = useState(null);
  const userName = getUserName();
  const accessToken = localStorage.getItem("accessToken");
  const inputRef = useRef();

  // WebSocket 연결 및 메시지 수신
  useEffect(() => {
    if (!roomId) return;
    // ws url에 roomId와 accessToken 쿼리 파라미터
    const wsUrl = `${WEBSOCKET_BASE}?roomId=${roomId}&accessToken=${accessToken}`;
    const ws = new window.WebSocket(wsUrl);

    ws.onopen = () => {
      // 연결 성공 시 행동
      // console.log("WebSocket 연결됨!");
    };

    ws.onmessage = (event) => {
      // 백엔드에서 JSON 채팅 dto 반환
      const msg = JSON.parse(event.data);
      setMessages((prev) => [...prev, msg]);
    };

    ws.onclose = () => {
      // console.log("WebSocket 닫힘");
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
    // roomId가 바뀔 때 새로 생성
  }, [roomId, accessToken]);

  // 메시지 전송
  const handleSend = () => {
    if (socket && socket.readyState === 1 && inputValue.trim()) {
      // 메시지 형식: { roomId, content }
      socket.send(JSON.stringify({ roomId, content: inputValue }));
      setInputValue("");
    }
  };

  // 엔터키 지원
  const handleInputKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        채팅방 #{roomId}
      </Typography>
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="메시지 입력"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyPress}
          sx={{ flex: 1, background: "#fff", borderRadius: 2 }}
          inputRef={inputRef}
        />
        <IconButton color="primary">
          <AttachFileIcon />
        </IconButton>
        <Button
          variant="contained"
          color="success"
          onClick={() => {
            console.log("버튼 클릭됨!!");
            handleSend();
          }}
          sx={{ borderRadius: 2, px: 2, minWidth: 38 }}
        >
          <SendIcon />
        </Button>
      </Box>
    </Box>
  );
}