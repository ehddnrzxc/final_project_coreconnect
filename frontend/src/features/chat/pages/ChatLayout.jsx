import React, { useState, useEffect, useRef, useContext } from "react";

import { Box } from "@mui/material";
import ChatHeader from "../components/ChatHeader";
import ChatSidebar from "../components/ChatSidebar";
import ChatRoomListPane from "../components/ChatRoomListPane";
import ChatDetailPane from "../components/ChatDetailPane";
import ChatRoomCreateDialog from "../components/ChatRoomCreateDialog";
import ToastList from "../components/ToastList";
import { UserProfileContext } from "../../../App";

import {
  markRoomMessagesAsRead,
  fetchChatRoomMessages,
  fetchChatRoomsLatest,
  createChatRoom
} from "../api/ChatRoomApi";

import {
  connectStomp,
  disconnectStomp,
  sendStompMessage
} from "../api/chatSocket";

// ===================== 시간 및 유저명 유틸 함수 =====================
// 시간 포맷팅 유틸
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

// 유저이름 얻기 유틸
function getUserName() {
  try {
    const user = useContext(UserProfileContext);
    return user?.name || "";
  } catch {
    return "";
  }
}

export default function ChatLayout() {
  // ---------- 상태 변수 ----------
  const [roomList, setRoomList] = useState([]); // 전체 채팅방 목록
  const [selectedRoomId, setSelectedRoomId] = useState(null); // 현재 선택된 방ID
  const [messages, setMessages] = useState([]); // 현재 방 메시지 목록
  const [tabIdx, setTabIdx] = useState(0); // 탭 인덱스
  const [toastRooms, setToastRooms] = useState([]); // 토스트 알림 Rooms
  const [createOpen, setCreateOpen] = useState(false); // 방 생성 다이얼로그 열림 여부

  const userName = getUserName(); // 유저명
  const accessToken = localStorage.getItem("accessToken"); // 엑세스토큰
  const inputRef = useRef(); // 입력창 관리 ref

  const [socketConnected, setSocketConnected] = useState(false); // 소켓 연결 상태

  // ---------- 읽지 않은 채팅방 개수 계산 ----------
  const unreadRoomCount = Array.isArray(roomList)
    ? roomList.filter((room) => room && room.unreadCount > 0).length
    : 0;

  // ---------- 채팅방 생성 ----------
  const handleCreateRoom = async (data) => {
    try {
      const room = await createChatRoom(data);
      if (!room || !room.roomId) throw new Error("응답 데이터 없음");
      setRoomList(prev => [...prev, room]);
      setSelectedRoomId(room.roomId); // 방 생성시에만 바로 진입
      setCreateOpen(false);
    } catch (error) {
      alert("채팅방 생성 에러: " + (error.message || "err"));
    }
  };

  // ---------- 새 메시지 도착 처리 (+ 토스트 알림) ----------
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

    if (!foundRoom) return;
    if (roomIdNum === Number(selectedRoomId)) {
      setMessages((prev) => [...prev, msg]);
    } else { // 다른 방이면 토스트 알림
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
    // roomList의 해당 방 정보를 최신화
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

  // ---------- 파일 업로드 ----------
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

  // ---------- 메시지 보내기 ----------
  const handleSend = () => {
    const message = inputRef.current.value;
    if (!message.trim()) {
      return;
    }
    
    if (!socketConnected) {
      alert("채팅 서버와 연결되어 있지 않습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    const success = sendStompMessage({ roomId: selectedRoomId, content: message });
    if (success) {
      inputRef.current.value = "";
    } else {
      alert("메시지 전송에 실패했습니다. 연결 상태를 확인해주세요.");
    }
  };

  // ---------- 스크롤로 읽음 처리 ----------
  const handleScrollRead = async () => {
    if (selectedRoomId && messages.length > 0) {
      await markRoomMessagesAsRead(selectedRoomId, accessToken);
      loadRooms();
    }
  };

  // ---------- 채팅방 목록 새로고침 (최신화) ----------
  // 이 함수에서 방 목록을 받아와도 setSelectedRoomId(null)로 설정하여
  // 첫 진입시 아무 방도 선택하지 않게 한다
  const loadRooms = async () => {
    const res = await fetchChatRoomsLatest();
    if (res && Array.isArray(res.data)) {
      setRoomList(res.data);
      setSelectedRoomId(null); // ★ 첫 진입시 아무 방도 자동 선택 안 함
    } else {
      setRoomList([]);
      setSelectedRoomId(null);
    }
  };

  // ---------- 채팅방 목록 최초 로드 ----------
  useEffect(() => {
    loadRooms();
  }, []);

  // ---------- 채팅방 선택시 메시지 로딩 ----------
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

  // ---------- STOMP 기반 채팅방 소켓 연결관리 ----------
  useEffect(() => {
    if (!selectedRoomId) return;

    connectStomp(
      selectedRoomId,
      msg => handleNewMessage(msg),
      () => setSocketConnected(true),
      () => setSocketConnected(false)
    );

    return () => {
      setSocketConnected(false);
      disconnectStomp();
    };
  }, [selectedRoomId]);

  // ---------- 메시지 박스 끝으로 스크롤 ----------
  const messagesEndRef = useRef(null);
  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------- 읽지 않은 메시지 계산 및 첫 unread 인덱스 ----------
  const unreadCount = messages.reduce((cnt, msg) => cnt + (msg.readYn === false ? 1 : 0), 0);
  const firstUnreadIdx = unreadCount > 0 ? messages.findIndex(msg => msg.readYn === false) : -1;

  // ---------- 렌더링 ----------
  return (
    <Box className="chat-layout" sx={{
      background: "#fafbfc", minHeight: "100vh",
      display: "flex", flexDirection: "row"
    }}>
      {/* 우측 하단 토스트 알림 */}
      <ToastList rooms={toastRooms} formatTime={formatTime} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} />
      {/* 왼쪽 사이드바 + 방 생성 */}
      <ChatSidebar unreadRoomCount={unreadRoomCount} onCreateRoom={() => setCreateOpen(true)} />
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", background: "#fafbfc" }}>
        <ChatHeader />
        <Box sx={{
          flex: 1, display: "flex", flexDirection: "row",
          px: 5, pt: 2, gap: 2, minHeight: 0
        }}>
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
            selectedRoom={Array.isArray(roomList)
              ? roomList.find(r => r && r.roomId === selectedRoomId) : null}
            messages={messages}
            userName={userName}
            unreadCount={unreadCount}
            firstUnreadIdx={firstUnreadIdx}
            formatTime={formatTime}
            inputRef={inputRef}
            onSend={handleSend}
            onFileUpload={handleFileUpload}
            socketConnected={socketConnected}
          />
        </Box>
      </Box>
      {/* 채팅방 생성 다이얼로그 */}
      <ChatRoomCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreateRoom} />
    </Box>
  );
}