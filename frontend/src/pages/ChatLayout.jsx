import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import {
  Box,
  Grid,
  Paper,
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

// 유저 이름(localStorage에서 가져오기) 함수 추가
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

export default function ChatLayout() {
  const [roomList, setRoomList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tabIdx, setTabIdx] = useState(0); // 전체/안읽음 탭
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

  // 파일/이미지 업로드 핸들러 (예시, 실제 전송 로직은 필요시 추가)
  const handleFileUpload = (e) => {
    const files = e.target.files;
    // TODO: FormData로 파일 전송 구현
    alert(`첨부파일 ${files[0]?.name} 업로드 로직 추가 예정`);
    e.target.value = "";
  };

  return (
    <Box className="chat-layout" sx={{ background: "#fafbfc", minHeight: "100vh" }}>
      <ChatHeader />
      <Box
        className="chat-content"
        sx={{
          display: "flex",
          background: "#fff",
          height: "calc(100vh - 56px)"
        }}
      >
        <ChatSidebar unreadRoomCount={unreadRoomCount} />
        <Box
          className="chat-center-wrap"
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            marginTop: 3
          }}
        >
          <Grid
            container
            spacing={5}
            sx={{
              justifyContent: "center",
              width: "auto",
              maxWidth: "1280px"
            }}
          >
            {/* Left: Room List */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={3}
                sx={{
                  borderRadius: 4,
                  height: 600,
                  padding: 0,
                  width: "100%",
                  maxWidth: 560
                }}
              >
                <Box sx={{ px: 3, pt: 2, pb: 1 }}>
                  <Tabs
                    value={tabIdx}
                    onChange={(_, v) => setTabIdx(v)}
                    sx={{ mb: 1 }}
                  >
                    <Tab label="전체" sx={{ fontWeight: 700 }} />
                    <Tab label="안읽음" sx={{ fontWeight: 700 }} />
                  </Tabs>
                </Box>
                <List
                  sx={{
                    overflowY: "auto",
                    px: 2,
                    height: "calc(100% - 72px)", // header+tabs 영역 빼기
                    scrollbarWidth: "thin",
                    "&::-webkit-scrollbar": {
                      width: 9
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "#d0f3e7",
                      borderRadius: "7px"
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "#eaf3fb"
                    }
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
                        borderRadius: 2,
                        mb: 1,
                        background: selectedRoomId === room.roomId ? "#e8f7ef" : "none"
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "#10c16d", mr: 1 }}>
                          {room.roomName?.[0]?.toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontWeight: 700 }}>{room.roomName}</Typography>
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
                              {room.unreadCount > 0 && (
                                <Badge
                                  badgeContent={room.unreadCount}
                                  color="error"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
            {/* Right: Chat window */}
            {selectedRoom && (
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={3}
                  sx={{
                    borderRadius: 4,
                    height: 600,
                    p: 2,
                    background: "#eaf3fb",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    width: "100%",
                    maxWidth: 560
                  }}
                >
                  {/* Top bar */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 2,
                      borderBottom: "1px solid #c9dbef",
                      pb: 1
                    }}
                  >
                    <Avatar sx={{ bgcolor: "#10c16d", mr: 2 }}>
                      {selectedRoom.roomName?.[0]?.toUpperCase()}
                    </Avatar>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "#1aaf54",
                        flex: 1
                      }}
                    >
                      {selectedRoom.roomName}
                    </Typography>
                    <IconButton>
                      <PhoneIcon />
                    </IconButton>
                    <IconButton>
                      <VideoCallIcon />
                    </IconButton>
                    <IconButton>
                      <GroupIcon />
                    </IconButton>
                    <IconButton>
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  {/* Messages */}
                  <Box
                    className="chat-room-msg-list"
                    sx={{
                      flex: 1,
                      width: "100%",
                      height: "400px",
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      py: 1,
                      scrollbarWidth: "thin",
                      "&::-webkit-scrollbar": { width: 9 },
                      "&::-webkit-scrollbar-thumb": {
                        background: "#d0f3e7",
                        borderRadius: "7px"
                      },
                      "&::-webkit-scrollbar-track": {
                        background: "#eaf3fb"
                      }
                    }}
                  >
                   {messages.map((msg) => {
                    const isMe = msg.senderName === userName;
                    return (
                      <Box
                        key={msg.id}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isMe ? "flex-end" : "flex-start",
                          mb: 2
                        }}
                      >
                        {!isMe && (
                          <Typography
                            variant="caption"
                            color="#7d87ab"
                            sx={{ mb: 0.5 }}
                          >
                            {msg.senderName}
                          </Typography>
                        )}
                        {/* 버블 + unreadCount Badge 위치 */}
                        <Box sx={{ display: "flex", alignItems: "center" }}>
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
                              borderRadius: "15px",
                              mb: 0.5,
                              bgcolor: isMe ? "#ffe585" : "#e6f3fb", // 내 메시지는 노랑, 남 메시지는 연파랑!
                              color: isMe ? "#1aaf54" : "#222",
                              boxShadow: "0 2px 8px #dadada11",
                              maxWidth: "270px",
                              wordBreak: "break-all",
                              border: !isMe ? "1px solid #d6dee1" : "none"
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
                            fontSize: 11,
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
                  {/* 메시지 입력창, 파일/이미지 하나로 통합 업로드 */}
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      mt: 1,
                      alignItems: "center",
                      gap: 1
                    }}
                  >
                    <TextField
                      inputRef={inputRef}
                      variant="outlined"
                      size="small"
                      placeholder="메시지 입력"
                      sx={{ flex: 1, background: "#f7f8fa", borderRadius: 2 }}
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
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}

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
      <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
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
      </Box>
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
        }}
      >
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
        }}
      >
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
        }}
      >
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
      {/* 필요시 추가 */}
    </Box>
  );
}