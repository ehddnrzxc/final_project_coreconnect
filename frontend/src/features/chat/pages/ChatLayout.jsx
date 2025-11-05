import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { Box, Snackbar, Slide, Typography, Badge, Divider } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import SendIcon from "@mui/icons-material/Send";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import AddIcon from "@mui/icons-material/Add";
import SortIcon from "@mui/icons-material/Sort";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import GroupIcon from "@mui/icons-material/Group";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import ToastList from "../components/ToastList";

import {
  markRoomMessagesAsRead,
  fetchChatRoomMessages,
  fetchChatRoomsLatest
} from "../api/ChatRoomApi";

// 유틸: 시간 포맷 함수
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

function ChatSidebar({ unreadRoomCount }) {
  return (
    <Box component="aside" className="chat-sidebar" sx={{
      width: 62, background: "#f7f8fa", display: "flex",
      flexDirection: "column", alignItems: "center", pt: 1.5, gap: 1.5,
      borderRight: "1px solid #f0f1f4"
    }}>
      <IconButton component={NavLink} to="/chat/new" color="success" sx={{
        width: 42, height: 42, borderRadius: "50%", mb: 0.5,
        bgcolor: "#10c16d", color: "#fff", fontSize: 22
      }}>
        <AddIcon />
      </IconButton>
      <IconButton component={NavLink} to="/chat/sort" sx={{
        width: 42, height: 42, borderRadius: "50%",
        bgcolor: "#fff", color: "#10c16d", fontSize: 20
      }}>
        <SortIcon />
      </IconButton>
      <IconButton component={NavLink} to="/chat/notice" sx={{
        width: 42, height: 42, borderRadius: "50%", bgcolor: "#fff", color: "#2db8ff",
        fontSize: 20, position: "relative"
      }}>
        <NotificationsNoneIcon />
        {unreadRoomCount > 0 && (
          <Badge badgeContent={unreadRoomCount} color="error" sx={{
            position: "absolute", top: 0, right: 0, fontSize: 13
          }} />
        )}
      </IconButton>
    </Box>
  );
}

const WEBSOCKET_BASE = "ws://localhost:8080/ws/chat";

export default function ChatLayout() {
  const [roomList, setRoomList] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tabIdx, setTabIdx] = useState(0);
  const userName = getUserName();
  const accessToken = localStorage.getItem("accessToken");
  const inputRef = useRef();
  const unreadRoomCount = roomList.filter((room) => room.unreadCount > 0).length;
  const messagesEndRef = useRef(null);
  const [toastRooms, setToastRooms] = useState([]); // Toast 알림용 상태

  // 스크롤로 읽음처리 (기존 로직 보존)
  useEffect(() => {
    const chatRoomMsgList = document.querySelector(".chat-room-msg-list");
    if (!chatRoomMsgList) return;

    const onScroll = () => {
      if (chatRoomMsgList.scrollHeight - chatRoomMsgList.scrollTop === chatRoomMsgList.clientHeight) {
        handleScrollRead();
      }
    };

    chatRoomMsgList.addEventListener("scroll", onScroll);
    return () => {
      chatRoomMsgList.removeEventListener("scroll", onScroll);
    };
  }, [selectedRoomId, messages]);

  // 채팅방 목록 불러오기
  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    async function loadRooms() {
      const res = await fetchChatRoomsLatest();
      // 데이터 구조: { status, message, data: [ ... ]}
      if (res && Array.isArray(res.data)) {
        setRoomList(res.data);
        setSelectedRoomId(res.data[0]?.roomId ?? null);
      }
    }
    loadRooms();
  }, []);

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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const socketRef = useRef(null);

  useEffect(() => {
    if (!selectedRoomId || !accessToken) return;
    let shouldReconnect = true;
    function connect() {
      const wsUrl = `${WEBSOCKET_BASE}?roomId=${selectedRoomId}&accessToken=${accessToken}`;
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        console.log("[WebSocket 연결됨!]");
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleNewMessage(msg);
        } catch(err) {
          console.warn("메시지 파싱 오류:", err);
        }
      };
      ws.onclose = () => {
        console.log("[WebSocket 연결 종료]");
        if (shouldReconnect) {
          setTimeout(() => { connect(); }, 1000);
        }
      };
      ws.onerror = (e) => {
        console.error("[WebSocket 에러]", e);
      };
      socketRef.current = ws;
    }
    connect();
    return () => {
      shouldReconnect = false;
      if (socketRef.current) socketRef.current.close();
    };
  }, [selectedRoomId, accessToken]);

  const selectedRoom = roomList.find((r) => r.roomId === selectedRoomId);

  const handleNewMessage = (msg) => {
    if (msg.senderName === userName) {
      if (Number(msg.roomId) === Number(selectedRoomId)) {
        setMessages(prev => [...prev, msg]);
      }
      return;
    }
    const roomIdNum = Number(msg.roomId);
    const foundRoom = roomList.find(r => Number(r.roomId) === roomIdNum);

    if (!foundRoom) {
      console.warn("[알림 제외] roomId "+roomIdNum+"가 roomList에 없습니다, 비동기 레이스 or 동기화 문제?");
      return;
    }
    if (roomIdNum === Number(selectedRoomId)) {
      setMessages(prev => [...prev, msg]);
    } else {
      setToastRooms(prev => {
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
    setRoomList(prevRoomList =>
      prevRoomList.map(room => Number(room.roomId) === roomIdNum ?
        {
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

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedRoomId) return;
    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);
    try  {
      const res = await fetch(`/api/v1/chat/${selectedRoomId}/messages/file`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }, 
        body: formData
      });
      if (!res.ok) throw new Error("파일 업로드 실패")
      const result = await res.json();
      const chatMessage = result.data;
      setMessages((prev) => [...prev, chatMessage]);
    } catch (err) {
      alert("파일 업로드에 실패했습니다: " + err.message);
    }
    e.target.value = "";
  };

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

  const handleScrollRead = async () => {
    if (selectedRoomId && messages.length > 0) {
      await markRoomMessagesAsRead(selectedRoomId, accessToken);
      loadRooms();
    }
  };

  const loadRooms = async () => {
    const res = await fetchChatRoomsLatest();
    if (res && Array.isArray(res.data)) {
      setRoomList(res.data);
      setSelectedRoomId(res.data[0]?.roomId ?? null);
    }
  }

  // ✅ ====== 여기서부터 안읽은 메시지입니다 ====== 라벨 조건 로직 개선
  // "readYn=false"가 하나 이상일 때만 표시, 아니면 라벨 표시X
  const unreadCount = messages.reduce((cnt, msg) => cnt + (msg.readYn === false ? 1 : 0), 0);
  const firstUnreadIdx = unreadCount > 0
    ? messages.findIndex(msg => msg.readYn === false)
    : -1;

  return (
    <Box className="chat-layout" sx={{ background: "#fafbfc", minHeight: "100vh", display: "flex", flexDirection: "row" }}>
      <ToastList
        rooms={toastRooms}
        formatTime={formatTime}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      />
      <ChatSidebar unreadRoomCount={unreadRoomCount} />
      <Box sx={{
        flex: 1, display: "flex", flexDirection: "column",
        minHeight: "100vh", background: "#fafbfc"
      }}>
        <ChatHeader />
        <Box sx={{
          flex: 1, display: "flex", flexDirection: "row",
          px: 5, pt: 2, gap: 2, minHeight: 0,
        }}>
          <Box sx={{
            flex: "0 0 420px", minWidth: 350, maxWidth: 470,
            height: "calc(100vh - 56px - 32px)", background: "#fff",
            borderRight: "1px solid #e3e8ef", boxShadow: "none", borderRadius: 0,
            display: "flex", flexDirection: "column", p: 0,
          }}>
            <Box sx={{ px: 0, pt: 0, pb: 1 }}>
              <Tabs
                value={tabIdx}
                onChange={(_, v) => setTabIdx(v)}
                variant="fullWidth"
                sx={{
                  borderBottom: "1px solid #e3e8ef",
                  background: "#f9fafb",
                  mb: 0,
                  minHeight: 44
                }}
              >
                <Tab label="전체" sx={{ fontWeight: 700, fontSize: 17, minHeight: 44 }} />
                <Tab label="안읽음" sx={{ fontWeight: 700, fontSize: 17, minHeight: 44 }} />
              </Tabs>
            </Box>
            <List
              sx={{
                overflowY: "auto",
                flex: 1,
                px: 2,
                bgcolor: "#fff",
                scrollbarWidth: "thin",
                "&::-webkit-scrollbar": { width: 8 },
                "&::-webkit-scrollbar-thumb": {
                  background: "#e4eaf3",
                  borderRadius: "7px"
                },
                "&::-webkit-scrollbar-track": { background: "#fff" }
              }}
            >
              {(tabIdx === 0 ? roomList : roomList.filter(r => r.unreadCount > 0)).map((room) => (
                <ListItem
                  key={room.roomId}
                  selected={selectedRoomId === room.roomId}
                  button
                  alignItems="flex-start"
                  onClick={() => setSelectedRoomId(room.roomId)}
                  sx={{
                    borderRadius: 0,
                    mb: 1,
                    background: selectedRoomId === room.roomId ? "#f3f6fa" : "#fff",
                    boxShadow: "none",
                    borderBottom: "1px solid #e9eaeb",
                    py: 2.4,
                    px: 1.2,
                    minHeight: "64px",
                    cursor: "pointer" // <- 손가락 모양 추가!
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "#10c16d", mr: 1 }}>
                      {room.roomName?.[0]?.toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  {/* ✅ 변경: 마지막 메시지와 시간 key 제대로 매핑! */}
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 18, flexGrow: 1 }}>
                          {room.roomName}
                        </Typography>
                        {room.unreadCount > 0 && (
                          <Badge
                            badgeContent={room.unreadCount}
                            sx={{
                              "& .MuiBadge-badge": {
                                background: "#ff7f1a",
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: "13px",
                                borderRadius: "10px",
                                py: 1, px: 1.2,
                              }
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          sx={{
                            fontSize: 14,
                            color: "#555",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}
                        >
                          {room.lastMessageContent ? room.lastMessageContent : ""}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                          <Typography
                            sx={{
                              fontSize: 13,
                              color: "#9495a0",
                              mr: 2
                            }}
                          >
                            {room.lasMessageTime ? formatTime(room.lasMessageTime) : ""}
                          </Typography>
                          {room.lastSenderName && (
                            <Typography
                              sx={{
                                fontSize: 13,
                                color: "#9495a0"
                              }}
                            >
                              {room.lastSenderName}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
          {/* 이하 채팅 상세 뷰(메시지 영역 등)는 변경 없음 */}
          <Box sx={{
            flex: 1, minWidth: "380px",
            height: "calc(100vh - 56px - 32px)", background: "#f8fbfd",
            display: "flex", flexDirection: "column", borderRadius: 0, boxShadow: "none",
          }}>
            {selectedRoom && (
              <>
                <Box sx={{
                  display: "flex", alignItems: "center", pb: 1,
                  borderBottom: "1px solid #e3e8ef", background: "#f8fbfd",
                  height: 64, position: "relative",
                }}>
                  <Avatar sx={{
                    bgcolor: "#10c16d",
                    mr: 2, width: 33, height: 33, ml: 2
                  }}>{selectedRoom.roomName?.[0]?.toUpperCase()}
                  </Avatar>
                  <Typography sx={{
                    fontWeight: 700, fontSize: 18, color: "#1aaf54",
                  }}>
                    {selectedRoom.roomName}
                  </Typography>
                  <Box sx={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 2
                  }}>
                    <IconButton><PhoneIcon /></IconButton>
                    <IconButton><VideoCallIcon /></IconButton>
                    <IconButton><GroupIcon /></IconButton>
                    <IconButton><MoreVertIcon /></IconButton>
                  </Box>
                </Box>
                <Box className="chat-room-msg-list"
                  sx={{
                    flex: 1, width: "100%", overflowY: "auto",
                    px: 4, pt: 2.5, pb: 2.5,
                    display: "flex", flexDirection: "column", gap: 0.5,
                    scrollbarWidth: "thin",
                    "&::-webkit-scrollbar": { width: 8 },
                    "&::-webkit-scrollbar-thumb": { background: "#e4eaf3", borderRadius: "7px" },
                    "&::-webkit-scrollbar-track": { background: "#f8fbfd" }
                  }}
                >
                  {/* "여기서부터 안읽은 메시지입니다" 라벨 조건 로직 개선 */}
                  {messages
                    .filter(msg => msg.fileYn || (msg.messageContent && msg.messageContent.trim() !== ""))
                    .map((msg, idx) => {
                      const isMe = msg.senderName === userName;
                      // 첫번째로 안읽은 메시지 앞에 라벨 표시 (안읽은 메시지가 하나 이상일 때만, 단 한번!)
                      const isFirstUnread = unreadCount > 0 && idx === firstUnreadIdx;
                      return (
                        <React.Fragment key={msg.id}>
                          {/* ====== 여기서부터 안읽은 메시지입니다 ====== 라벨 */}
                          {isFirstUnread && (
                            <Box sx={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              mb: 2.2,
                              mt: 1.2,
                              zIndex: 2,
                            }}>
                              <Box sx={{
                                bgcolor: "#e1e3e6",
                                px: 2.8,
                                py: 1.1,
                                borderRadius: 2,
                                boxShadow: "none",
                              }}>
                                <Typography sx={{
                                  color: "#555",
                                  fontWeight: 700,
                                  fontSize: 16,
                                  letterSpacing: "1.5px",
                                  textAlign: "center"
                                }}>
                                  ====== 여기서부터 안읽은 메시지입니다 ======
                                </Typography>
                              </Box>
                            </Box>
                          )}
                          {/* 기존 메시지 렌더링 */}
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: isMe ? "flex-end" : "flex-start",
                              mb: 1.7, width: "100%",
                            }}
                          >
                            {!isMe && (
                              <Typography variant="caption" color="#7d87ab"
                                sx={{ mb: 0.5, fontWeight: 600, fontSize: 14 }}
                              >
                                {msg.senderName}
                              </Typography>
                            )}
                            <Box sx={{ display: "flex", alignItems: "center", maxWidth: "330px" }}>
                              {isMe && msg.unreadCount > 0 && (
                                <Badge badgeContent={msg.unreadCount} sx={{
                                  mr: 1,
                                  "& .MuiBadge-badge": {
                                    background: "#f6c745",
                                    color: "#222",
                                    fontWeight: 700,
                                    borderRadius: "8px",
                                    fontSize: "13px"
                                  }
                                }}/>
                              )}
                              <Box
                                sx={{
                                  display: "inline-block",
                                  fontSize: 15, px: 2, py: 1, borderRadius: "10px", mb: 0.5,
                                  bgcolor: isMe ? "#ffe585" : "#f7f9fc",
                                  color: isMe ? "#1aaf54" : "#222", boxShadow: "none",
                                  width: "fit-content", maxWidth: "270px",
                                  wordBreak: "break-all",
                                  border: isMe ? "none" : "1px solid #e4eaf3"
                                }}>
                                {msg.fileYn && msg.fileUrl
                                  ? (
                                    msg.fileUrl.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ?
                                      <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <img
                                          src={msg.fileUrl}
                                          alt={msg.fileName || "이미지"}
                                          style={{ maxWidth: "220px", maxHeight: "220px", borderRadius: 8 }}
                                        />
                                      </a>
                                    :
                                      <a
                                        href={msg.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          color: "#4a90e2",
                                          textDecoration: "underline",
                                          fontWeight: 600,
                                          wordBreak: "break-all"
                                        }}
                                      >
                                        {msg.fileName || "파일"}
                                      </a>
                                  )
                                  : (msg.messageContent || "")
                                }
                              </Box>
                              {!isMe && msg.unreadCount > 0 && (
                                <Badge badgeContent={msg.unreadCount} sx={{
                                  ml: 1,
                                  "& .MuiBadge-badge": {
                                    background: "#f6c745",
                                    color: "#222",
                                    fontWeight: 700,
                                    borderRadius: "8px",
                                    fontSize: "13px"
                                  }
                                }}/>
                              )}
                            </Box>
                            <Typography
                              sx={{
                                fontSize: 12,
                                color: "#b0b6ce",
                                alignSelf: isMe ? "flex-end" : "flex-start",
                                mt: 0.5
                              }}
                            >
                              {formatTime(msg.sendAt)}
                            </Typography>
                          </Box>
                        </React.Fragment>
                      );
                    })}
                  <div ref={messagesEndRef} />
                </Box>
                <Box sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  px: 4, py: 2.1,
                  borderTop: "1px solid #e3e8ef",
                  gap: 1,
                  background: "#f8fbfd"
                }}>
                  <TextField
                    inputRef={inputRef}
                    variant="outlined"
                    size="small"
                    placeholder="메시지 입력"
                    sx={{ flex: 1, background: "#fff", borderRadius: 2 }}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleSend();
                    }}
                  />
                  <label htmlFor="chat-file-upload">
                    <input
                      type="file"
                      multiple
                      style={{ display: "none" }}
                      id="chat-file-upload"
                      accept="image/*,application/pdf,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.txt,.hwp"
                      onChange={handleFileUpload}
                    />
                    <IconButton color="primary" component="span" sx={{ bgcolor: "#fff" }}>
                      <AttachFileIcon />
                    </IconButton>
                  </label>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleSend}
                    disabled={!socketRef.current || socketRef.current.readyState !== 1}
                  >
                    <SendIcon />
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}