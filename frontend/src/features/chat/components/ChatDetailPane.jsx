import React, { useRef, useEffect, useState } from "react";
import { Box, Avatar, Typography, IconButton, AvatarGroup } from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ChatMessageList from "./ChatMessageList";
import ChatMessageInputBox from "./ChatMessageInputBox";
import ChatRoomParticipantsDialog from "./ChatRoomParticipantsDialog";
import ChatRoomInviteDialog from "./ChatRoomInviteDialog";
import { fetchChatRoomUsers } from "../api/ChatRoomApi";

// 오른쪽 채팅방 상세패널(상단 Room, 메시지, 입력창)
function ChatDetailPane({
  selectedRoom, messages,
  unreadCount, firstUnreadIdx, formatTime, // eslint-disable-line no-unused-vars
  inputRef, onSend, onFileUpload, socketConnected,
  onScrollTop, isLoadingMore, hasMoreAbove
}) {
  const messagesEndRef = useRef(null);
  const [participantsDialogOpen, setParticipantsDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({behavior: "smooth"});
  }, [messages]);

  // 참여자 목록 조회
  useEffect(() => {
    if (selectedRoom?.roomId) {
      fetchChatRoomUsers(selectedRoom.roomId)
        .then((userList) => {
          setParticipants(Array.isArray(userList) ? userList : []);
        })
        .catch((err) => {
          console.error("참여자 목록 조회 실패:", err);
          setParticipants([]);
        });
    }
  }, [selectedRoom?.roomId]);

  if (!selectedRoom) return <Box flex={1} bgcolor="#f8fbfd"></Box>;

  return (
    <Box sx={{
      flex: 1, minWidth: "380px",
      height: "calc(100vh - 56px - 32px)", background: "#f8fbfd",
      display: "flex", flexDirection: "column", borderRadius: 0, boxShadow: "none",
    }}>
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
        {/* 참여자 프로필 이미지 표시 (최대 4명) */}
        {participants.length > 0 && (
          <Box sx={{ ml: 2, display: "flex", alignItems: "center" }}>
            <AvatarGroup
              max={4}
              sx={{
                "& .MuiAvatar-root": {
                  width: 28,
                  height: 28,
                  fontSize: 12,
                  border: "2px solid #fff",
                },
              }}
              onClick={() => setParticipantsDialogOpen(true)}
              style={{ cursor: "pointer" }}
            >
              {participants.map((user) => (
                <Avatar
                  key={user.id}
                  src={user.profileImageUrl}
                  sx={{ bgcolor: "#10c16d" }}
                >
                  {user.name?.[0]?.toUpperCase() || "?"}
                </Avatar>
              ))}
            </AvatarGroup>
          </Box>
        )}
        <Box sx={{
          position: "absolute",
          top: 0,
          right: 0,
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 2
        }}>
          <IconButton
            onClick={() => setInviteDialogOpen(true)}
            title="참여자 초대"
          >
            <PersonAddIcon />
          </IconButton>
          <IconButton
            onClick={() => setParticipantsDialogOpen(true)}
            title="참여자 목록"
          >
            <GroupIcon />
          </IconButton>
          <IconButton><MoreVertIcon /></IconButton>
        </Box>
      </Box>
      <ChatMessageList
        messages={messages}
        roomType={selectedRoom.roomType || "group"}
        onLoadMore={onScrollTop}
        hasMoreAbove={hasMoreAbove}
        loadingAbove={isLoadingMore}
      />
      <div ref={messagesEndRef} />
      <ChatMessageInputBox
        inputRef={inputRef}
        onSend={onSend}
        onFileUpload={onFileUpload}
        socketConnected={socketConnected}
      />
      
      {/* 채팅방 참여자 목록 다이얼로그 */}
      <ChatRoomParticipantsDialog
        open={participantsDialogOpen}
        onClose={() => setParticipantsDialogOpen(false)}
        roomId={selectedRoom?.roomId || selectedRoom?.id}
      />
      
      {/* 채팅방 참여자 초대 다이얼로그 */}
      <ChatRoomInviteDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        roomId={selectedRoom?.roomId || selectedRoom?.id}
        onInviteSuccess={() => {
          // 초대 성공 후 참여자 목록 새로고침
          if (selectedRoom?.roomId) {
            fetchChatRoomUsers(selectedRoom.roomId)
              .then((userList) => {
                setParticipants(Array.isArray(userList) ? userList : []);
              })
              .catch((err) => {
                console.error("참여자 목록 조회 실패:", err);
              });
          }
        }}
      />
    </Box>
  );
}
export default ChatDetailPane;