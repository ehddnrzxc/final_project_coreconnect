import React, { useState, useEffect, useRef } from "react";
import { Box } from "@mui/material";
import ChatHeader from "../components/ChatHeader";
import ChatSidebar from "../components/ChatSidebar";
import ChatRoomListPane from "../components/ChatRoomListPane";
import ChatDetailPane from "../components/ChatDetailPane";
import ChatRoomCreateDialog from "../components/ChatRoomCreateDialog";
import ToastList from "../components/ToastList";

import {
  markRoomMessagesAsRead,
  fetchChatRoomMessages,
  fetchChatRoomsLatest,
  createChatRoom
} from "../api/ChatRoomApi";

// 시간 및 유저명 유틸
function formatTime(sendAt) {
  if (!sendAt) return "";
  const d = new Date(sendAt);
  const today = new Date();
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (isToday) {
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  } else {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  }
}

function getUserName() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.name || "";
  } catch {
    return "";
  }
}

const WEBSOCKET_BASE = "ws://localhost:8080/ws/chat";

export default function ChatLayout() {
  const [roomList, setRoomList] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tabIdx, setTabIdx] = useState(0);
  const [toastRooms, setToastRooms] = useState([]);
  const [createOpen, setCreateOpen] = useState(false); // 방 생성 다이얼로그
  const userName = getUserName();
  const accessToken = localStorage.getItem("accessToken");
  const inputRef = useRef();
  const socketRef = useRef(null);

  // 방 목록에서 unreadCount가 0보다 큰 방의 개수 (사이드바 뱃지용)
  const unreadRoomCount = Array.isArray(roomList)
    ? roomList.filter((room) => room && room.unreadCount > 0).length
    : 0;

  // 채팅방 생성 핸들러 (반드시 http/axios 사용)
  const handleCreateRoom = async (data) => {
    try {
      const room = await createChatRoom(data); // 서버는 방 객체 반환
      if (!room || !room.roomId) throw new Error("응답 데이터 없음");
      setRoomList(prev => [...prev, room]);
      setSelectedRoomId(room.roomId);
      setCreateOpen(false);
    } catch (error) {
      alert("채팅방 생성 에러: " + (error.message || "err"));
    }
  };

  // 새 메시지 도착시 최신화, 읽음, 토스트 처리
  const handleNewMessage = (msg) => {
    if (msg.senderName === userName) {
      if (Number(msg.roomId) === Number(selectedRoomId)) {
        setMessages((prev) => [...prev, msg]);
      }
      return;
    }
    const roomIdNum = Number(msg.roomId);
    const foundRoom = Array.isArray(roomList)
      ? roomList.find(r => r && Number(r.roomId) === roomIdNum)
      : null;

    if (!foundRoom) return; // 알림만 해당
    if (roomIdNum === Number(selectedRoomId)) {
      setMessages((prev) => [...prev, msg]);
    } else {
      setToastRooms((prev) => {
        const filtered = prev.filter(r => Number(r.roomId) !== roomIdNum);
        const newToast = {
          roomId: msg.roomId,
          unreadCount: msg.unreadCount || 1,
          lastUnreadMessageContent: msg.messageContent,
          lastUnreadMessageSenderName: msg.senderName,
          lastUnreadMessageTime: msg.sendAt,
          roomName: foundRoom.roomName
        };
        return [...filtered, newToast].sort(
          (a, b) => new Date(b.lastUnreadMessageTime) - new Date(a.lastUnreadMessageTime)
        );
      });
    }
    setRoomList((prevRoomList) =>
      prevRoomList.map(room => Number(room.roomId) === roomIdNum
        ? {
          ...room,
          messageContent: msg.messageContent,
          fileYn: msg.fileYn,
          sendAt: msg.sendAt,
          unreadCount: msg.unreadCount,
        }
        : room
      )
    );
  };

  // 파일 업로드
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedRoomId) return;
    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`/api/v1/chat/${selectedRoomId}/messages/file`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData
      });
      if (!res.ok) throw new Error("파일 업로드 실패");
      const result = await res.json();
      const chatMessage = result.data;
      setMessages((prev) => [...prev, chatMessage]);
    } catch (err) {
      alert("파일 업로드에 실패했습니다: " + err.message);
    }
    e.target.value = "";
  };

  // 메시지 보내기
  const handleSend = () => {
    const message = inputRef.current.value;
    const currSocket = socketRef.current;
    if (currSocket && currSocket.readyState === 1 && message.trim()) {
      const payload = JSON.stringify({
        roomId: selectedRoomId,
        content: message,
        fileYn: false,
        fileUrl: null
      });
      currSocket.send(payload);
      inputRef.current.value = "";
    } else {
      console.log("[소켓 미연결 혹은 메시지 없음]", currSocket?.readyState);
    }
  };

  // 채팅방 스크롤로 읽음 처리
  const handleScrollRead = async () => {
    if (selectedRoomId && messages.length > 0) {
      await markRoomMessagesAsRead(selectedRoomId, accessToken);
      loadRooms();
    }
  };

  // 채팅방 목록 새로고침
  const loadRooms = async () => {
    const res = await fetchChatRoomsLatest();
    if (res && Array.isArray(res.data)) {
      setRoomList(res.data);
      setSelectedRoomId(res.data[0]?.roomId ?? null);
    } else {
      setRoomList([]);
    }
  };

  useEffect(() => { loadRooms(); }, []);

  // 채팅방 별 메시지 새로고침
  useEffect(() => {
    async function loadMessages() {
      if (selectedRoomId) {
        const res = await fetchChatRoomMessages(selectedRoomId);
        if (res && Array.isArray(res.data)) {
          setMessages(res.data);
        } else {
          setMessages([]);
        }
      }
    }
    loadMessages();
  }, [selectedRoomId]);

  // ws 연결 관리
  useEffect(() => {
    if (!selectedRoomId || !accessToken) return;
    let shouldReconnect = true;
    function connect() {
      const wsUrl = `${WEBSOCKET_BASE}?roomId=${selectedRoomId}&accessToken=${accessToken}`;
      const ws = new window.WebSocket(wsUrl);
      ws.onopen = () => {};
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleNewMessage(msg);
        } catch (err) {}
      };
      ws.onclose = () => {
        if (shouldReconnect) setTimeout(() => { connect(); }, 1000);
      };
      ws.onerror = () => {};
      socketRef.current = ws;
    }
    connect();
    return () => { shouldReconnect = false; if (socketRef.current) socketRef.current.close(); };
  }, [selectedRoomId, accessToken]);

  const messagesEndRef = useRef(null);
  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const unreadCount = messages.reduce((cnt, msg) => cnt + (msg.readYn === false ? 1 : 0), 0);
  const firstUnreadIdx = unreadCount > 0 ? messages.findIndex(msg => msg.readYn === false) : -1;

  return (
    <Box className="chat-layout" sx={{ background: "#fafbfc", minHeight: "100vh", display: "flex", flexDirection: "row" }}>
      <ToastList rooms={toastRooms} formatTime={formatTime} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} />
      <ChatSidebar unreadRoomCount={unreadRoomCount} onCreateRoom={() => setCreateOpen(true)} />
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", background: "#fafbfc" }}>
        <ChatHeader />
        <Box sx={{ flex: 1, display: "flex", flexDirection: "row", px: 5, pt: 2, gap: 2, minHeight: 0 }}>
          <ChatRoomListPane
            tabIdx={tabIdx}
            setTabIdx={setTabIdx}
            roomList={roomList}
            selectedRoomId={selectedRoomId}
            setSelectedRoomId={setSelectedRoomId}
            unreadRoomCount={unreadRoomCount}
            formatTime={formatTime}
          />
          <ChatDetailPane
            selectedRoom={Array.isArray(roomList) ? roomList.find(r => r && r.roomId === selectedRoomId) : null}
            messages={messages}
            userName={userName}
            unreadCount={unreadCount}
            firstUnreadIdx={firstUnreadIdx}
            formatTime={formatTime}
            inputRef={inputRef}
            onSend={handleSend}
            onFileUpload={handleFileUpload}
            socketConnected={!!socketRef.current && socketRef.current.readyState === 1}
          />
        </Box>
      </Box>
      <ChatRoomCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreateRoom} />
    </Box>
  );
}