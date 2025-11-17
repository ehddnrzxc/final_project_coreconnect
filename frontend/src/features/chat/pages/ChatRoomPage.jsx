import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import ChatRoomContainer from "../components/Chat/ChatRoomContainer";
import { UserProfileContext } from "../../../App";

function GetUserName() {
  try {
    const user = useContext(UserProfileContext);
    return user?.name || "";
  } catch {
    return "";
  }
}

const WEBSOCKET_BASE = "ws://localhost:8080/ws/chat";

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [socket, setSocket] = useState(null);
  const userName = GetUserName();
  const accessToken = localStorage.getItem("accessToken");

  // WebSocket 연결 및 메시지 수신
  useEffect(() => {
    if (!roomId) return;
    const wsUrl = `${WEBSOCKET_BASE}?roomId=${roomId}&accessToken=${accessToken}`;
    const ws = new window.WebSocket(wsUrl);

    ws.onopen = () => {
      // 연결 성공시
    };
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setMessages((prev) => [...prev, msg]);
    };
    ws.onclose = () => {
      // 연결 종료시
    };
    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [roomId, accessToken]);

  // 메시지 전송 함수
  const handleSend = () => {
    if (socket && socket.readyState === 1 && inputValue.trim()) {
      socket.send(JSON.stringify({ roomId, content: inputValue }));
      setInputValue("");
    }
  };

  return (
    <ChatRoomContainer
      roomId={roomId}
      messages={messages}
      userName={userName}
      inputValue={inputValue}
      setInputValue={setInputValue}
      onSend={handleSend}
    />
  );
}