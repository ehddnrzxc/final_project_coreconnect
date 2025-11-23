import React, { useState, useEffect } from "react";
import {
  Box,
  IconButton,
  Popover,
  Typography,
  Divider,
  List,
  ListItem,
  Chip,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { formatTime } from "../../../utils/TimeUtils";
import { useNavigate } from "react-router-dom";

export default function ChatPopover({
  anchorEl,
  open,
  onClose,
  roomList = [],
}) {
  const navigate = useNavigate();
  const [unreadRooms, setUnreadRooms] = useState([]);

  // 읽지 않은 채팅방 필터링 및 정렬
  useEffect(() => {
    if (open && roomList) {
      const filtered = roomList
        .filter((room) => room && room.unreadCount > 0)
        .map((room) => ({
          roomId: room.roomId,
          roomName: room.roomName || "채팅방",
          unreadCount: room.unreadCount || 0,
          lastMessageContent: room.lastMessageContent || "",
          lastMessageTime: room.lasMessageTime || room.sendAt || null,
          lastSenderName: room.lastSenderName || "",
          lastMessageFileYn: room.lastMessageFileYn || false,
        }))
        .sort((a, b) => {
          // 최신 메시지 시간 기준 내림차순 정렬
          const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
          const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
          return timeB - timeA;
        });
      setUnreadRooms(filtered);
    }
  }, [open, roomList]);

  const handleGoToRoom = (roomId) => {
    onClose();
    // 채팅 페이지로 이동하고 해당 채팅방 선택
    navigate("/chat", { state: { selectedRoomId: roomId } });
  };

  const handleGoToChatList = () => {
    onClose();
    // 채팅 페이지로 이동 (특정 채팅방 선택 없이)
    navigate("/chat");
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          width: 360,
          maxHeight: 500,
          boxShadow: 4,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            채팅
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {unreadRooms.length > 0 ? (
          <>
            <List dense sx={{ maxHeight: 400, overflowY: "auto", mb: 2 }}>
              {unreadRooms.map((room) => (
                <ListItem
                  key={room.roomId}
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderRadius: 1,
                    mb: 0.5,
                    cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                  onClick={() => handleGoToRoom(room.roomId)}
                >
                  <Box sx={{ width: "100%" }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 0.5,
                      }}
                    >
                      <Chip
                        label={room.roomName}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: "0.7rem" }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {room.lastMessageTime ? formatTime(room.lastMessageTime) : ""}
                      </Typography>
                    </Box>
                    {room.lastSenderName && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mb: 0.5 }}
                      >
                        {room.lastSenderName}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      {room.lastMessageFileYn ? "이미지 업로드" : (room.lastMessageContent || "메시지가 없습니다.")}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Button
                variant="outlined"
                size="small"
                endIcon={<ArrowForwardIcon fontSize="small" />}
                onClick={handleGoToChatList}
                sx={{
                  textTransform: "none",
                  fontSize: "0.875rem",
                }}
              >
                채팅방 목록으로 가기
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", py: 3 }}
            >
              읽지 않은 메시지가 없습니다.
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Button
                variant="outlined"
                size="small"
                endIcon={<ArrowForwardIcon fontSize="small" />}
                onClick={handleGoToChatList}
                sx={{
                  textTransform: "none",
                  fontSize: "0.875rem",
                }}
              >
                채팅방 목록으로 가기
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Popover>
  );
}

