import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import {
  Box,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Badge,
  Tab,
  Tabs,
  IconButton,
  TextField,
  Button
} from "@mui/material";
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
import "./ChatLayout.css";
import {
  fetchChatRoomMessages,
  fetchChatRoomsLatest
} from "../api/ChatRoomApi";

function getUserName() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.name || "";
  } catch {
    return "";
  }
}

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

// --- ChatHeader 컴포넌트 추가! ---
function ChatHeader() {
  return (
    <Box
      className="chat-header"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "56px",
        background: "#fff",
        borderBottom: "1px solid #f0f1f4",
        px: 3,
        gap: 2
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <PersonIcon sx={{ fontSize: 26, color: "#10c16d" }} />
        <Typography sx={{ fontSize: 20, fontWeight: 600, color: "#222" }}>
          채팅
        </Typography>
      </Box>
      {/* <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="메시지 검색"
          sx={{
            width: 330,
            height: 36,
            borderRadius: 2,
            background: "#f7f8fa"
          }}
        />
      </Box> */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          fontSize: 22,
          color: "#bbb"
        }}
      >
        <IconButton>
          <NotificationsNoneIcon />
        </IconButton>
        <IconButton>
          <PersonIcon />
        </IconButton>
      </Box>
    </Box>
  );
}

// --- ChatSidebar 컴포넌트 추가! ---
function ChatSidebar({ unreadRoomCount }) {
  return (
    <Box
      component="aside"
      className="chat-sidebar"
      sx={{
        width: 62,
        background: "#f7f8fa",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pt: 1.5,
        gap: 1.5,
        borderRight: "1px solid #f0f1f4"
      }}
    >
      <IconButton 
        component={NavLink}
        to="/chat/new"
        color="success"
        sx={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          mb: 0.5,
          bgcolor: "#10c16d",
          color: "#fff",
          fontSize: 22
        }}>
        <AddIcon />
      </IconButton>
      <IconButton
        component={NavLink}
        to="/chat/sort"
        sx={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          bgcolor: "#fff",
          color: "#10c16d",
          fontSize: 20
        }}>
        <SortIcon />
      </IconButton>
      <IconButton
        component={NavLink}
        to="/chat/notice"
        sx={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          bgcolor: "#fff",
          color: "#2db8ff",
          fontSize: 20,
          position: "relative"
        }}>
        <NotificationsNoneIcon />
        {unreadRoomCount > 0 && (
          <Badge
            badgeContent={unreadRoomCount}
            color="error"
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              fontSize: 13
            }}
          />
        )}
      </IconButton>
      {/* 필요시 추가 버튼 */}
    </Box>
  );
}

export default function ChatLayout() {
  const [roomList, setRoomList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tabIdx, setTabIdx] = useState(0);
  const userName = getUserName();
  const inputRef = useRef();

  const unreadRoomCount = roomList.filter((room) => room.unreadCount > 0).length;

  useEffect(() => {
    async function loadRooms() {
      setLoading(true);
      const res = await fetchChatRoomsLatest();
      if (res && res.status === 200 && Array.isArray(res.data)) {
        const sortedRooms = [...res.data].sort(
          (a, b) => new Date(b.sendAt) - new Date(a.sendAt)
        );
        setRoomList(sortedRooms);
        setSelectedRoomId(sortedRooms[0]?.roomId ?? null);
      }
      setLoading(false);
    }
    loadRooms();
  }, []);

  useEffect(() => {
    async function loadMessages() {
      if (selectedRoomId) {
        const res = await fetchChatRoomMessages(selectedRoomId);
        if (res && res.status === 200 && Array.isArray(res.data)) {
          const sorted = [...res.data].sort(
            (a, b) => new Date(a.sendAt) - new Date(b.sendAt)
          );
          setMessages(sorted);
        } else {
          setMessages([]);
        }
      }
    }
    loadMessages();
  }, [selectedRoomId]);

  const selectedRoom = roomList.find((r) => r.roomId === selectedRoomId);

  if (loading) {
    return <Box p={2}>채팅방 목록 로딩중...</Box>;
  }

  const handleFileUpload = (e) => {
    const files = e.target.files;
    alert(`첨부파일 ${files[0]?.name} 업로드 로직 추가 예정`);
    e.target.value = "";
  };

  return (
    <Box className="chat-layout" sx={{ background: "#fafbfc", minHeight: "100vh", display: "flex", flexDirection: "row" }}>
      <ChatSidebar unreadRoomCount={unreadRoomCount} />
      <Box sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "#fafbfc"
      }}>
        <ChatHeader />
        <Box sx={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          px: 5,
          pt: 2,
          gap: 2,
          minHeight: 0,
        }}>
          {/* 채팅방 목록 */}
          <Box sx={{
            flex: "0 0 420px",
            minWidth: 350,
            maxWidth: 470,
            height: "calc(100vh - 56px - 32px)",
            background: "#fff",
            borderRight: "1px solid #e3e8ef",
            boxShadow: "none",
            borderRadius: 0,    // ← 둥근모서리·그림자 제거
            display: "flex",
            flexDirection: "column",
            p: 0,
          }}>
            <Box sx={{ px: 0, pt: 0, pb: 1 }}>
              <Tabs
                value={tabIdx}
                onChange={(_, v) => setTabIdx(v)}
                variant="fullWidth"
                sx={{
                  borderBottom: "1px solid #e3e8ef",
                  background: "#f9fafb", // 밝은 줄
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
                    minHeight: "64px"
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "#10c16d", mr: 1 }}>
                      {room.roomName?.[0]?.toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
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
                          {room.fileYn ? "[파일]" : room.messageContent || ""}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                          <Typography
                            sx={{
                              fontSize: 13,
                              color: "#9495a0",
                              mr: 2
                            }}
                          >
                            {formatTime(room.sendAt)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
          {/* 채팅방 메시지(오른쪽) */}
          <Box sx={{
            flex: 1,
            minWidth: "380px",
            height: "calc(100vh - 56px - 32px)",
            background: "#f8fbfd",
            display: "flex",
            flexDirection: "column",
            borderRadius: 0, // 팝업 느낌 배제
            boxShadow: "none",
          }}>
            {/* 최상단 바 */}
            {selectedRoom &&
              <Box sx={{
                display: "flex",
                alignItems: "center",
                pt: 2,
                px: 4,
                pb: 1,
                borderBottom: "1px solid #e3e8ef"
              }}>
                <Avatar sx={{ bgcolor: "#10c16d", mr: 2, width: 33, height: 33 }}>
                  {selectedRoom.roomName?.[0]?.toUpperCase()}
                </Avatar>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: 18,
                    color: "#1aaf54",
                    flex: 1
                  }}
                >
                  {selectedRoom.roomName}
                </Typography>
                <IconButton><PhoneIcon /></IconButton>
                <IconButton><VideoCallIcon /></IconButton>
                <IconButton><GroupIcon /></IconButton>
                <IconButton><MoreVertIcon /></IconButton>
              </Box>
            }
            {/* 메시지 리스트 */}
            <Box
              className="chat-room-msg-list"
              sx={{
                flex: 1,
                width: "100%",
                overflowY: "auto",
                px: 4, pt: 2.5, pb: 2.5,
                display: "flex", flexDirection: "column",
                gap: 0.5,
                scrollbarWidth: "thin",
                "&::-webkit-scrollbar": { width: 8 },
                "&::-webkit-scrollbar-thumb": {
                  background: "#e4eaf3",
                  borderRadius: "7px"
                },
                "&::-webkit-scrollbar-track": { background: "#f8fbfd" }
              }}
            >
              {selectedRoom && messages.map(msg => {
                const isMe = msg.senderName === userName;
                return (
                  <Box
                    key={msg.id}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMe ? "flex-end" : "flex-start",
                      mb: 1.7,
                      width: "100%",
                    }}
                  >
                    {!isMe && (
                      <Typography
                        variant="caption"
                        color="#7d87ab"
                        sx={{ mb: 0.5, fontWeight: 600, fontSize: 14 }}
                      >
                        {msg.senderName}
                      </Typography>
                    )}
                    {/* 버블 + unreadCount Badge 위치 */}
                    <Box sx={{ display: "flex", alignItems: "center", maxWidth: "330px" }}>
                      {/* 내가 보낸 메시지면 왼쪽에 뱃지 */}
                      {isMe && msg.unreadCount > 0 && (
                        <Badge
                          badgeContent={msg.unreadCount}
                          sx={{
                            mr: 1,
                            "& .MuiBadge-badge": {
                              background: "none",
                              color: "#f6c745",
                              fontWeight: 700,
                              borderRadius: "8px",
                              fontSize: "13px"
                            }
                          }}
                        />
                      )}
                      {/* 메시지 버블 */}
                      <Box
                        sx={{
                          display: "inline-block",
                          fontSize: 15,
                          px: 2,
                          py: 1,
                          borderRadius: "10px",
                          mb: 0.5,
                          bgcolor: isMe ? "#ffe585" : "#f7f9fc",
                          color: isMe ? "#1aaf54" : "#222",
                          boxShadow: "none",
                          width: "fit-content",
                          maxWidth: "270px",
                          wordBreak: "break-all",
                          border: isMe ? "none" : "1px solid #e4eaf3"
                        }}
                      >
                        {msg.fileYn ? "[파일]" : msg.messageContent || ""}
                      </Box>
                      {/* 상대 메시지라면 오른쪽에 뱃지 */}
                      {!isMe && msg.unreadCount > 0 && (
                        <Badge
                          badgeContent={msg.unreadCount}
                          sx={{
                            ml: 1,
                            "& .MuiBadge-badge": {
                              background: "none",
                              color: "#f6c745",
                              fontWeight: 700,
                              borderRadius: "8px",
                              fontSize: "13px"
                            }
                          }}
                        />
                      )}
                    </Box>
                    {/* 시간 표시 */}
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
                );
              })}
            </Box>
            {/* 입력창 */}
            {selectedRoom &&
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  px: 4,
                  py: 2.1,
                  borderTop: "1px solid #e3e8ef",
                  gap: 1,
                  background: "#f8fbfd"
                }}
              >
                <TextField
                  inputRef={inputRef}
                  variant="outlined"
                  size="small"
                  placeholder="메시지 입력"
                  sx={{ flex: 1, background: "#fff", borderRadius: 2 }}
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
                  sx={{ minWidth: 36, px: 2, borderRadius: 2 }}
                >
                  <SendIcon />
                </Button>
              </Box>
            }
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ... ChatHeader, ChatSidebar 함수는 기존과 동일하게 둡니다.
