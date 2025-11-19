import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, List, ListItem, ListItemButton, ListItemAvatar, ListItemText, Badge, Avatar, Typography, Chip } from "@mui/material";
import http from "../../../api/http"; // axios 인스턴스 불러오기

// 채팅방 목록(좌측) & 탭
function ChatRoomListPane({
  tabIdx, setTabIdx, roomList, selectedRoomId, setSelectedRoomId, unreadRoomCount, formatTime
}) {
  // 참여자 수 정보를 저장할 state: { [roomId]: 참여자수 }
  const [roomMemberCounts, setRoomMemberCounts] = useState({});

  // roomList가 바뀔 때마다 각 방의 참여자 수 API 호출
  useEffect(() => {
    async function fetchAllMemberCounts() {
      const obj = {};
      await Promise.all(
        roomList.map(async (room) => {
          try {
            // GET /chat/{roomId}/users → 응답 data.data에 사용자 배열
            const res = await http.get(`/chat/${room.roomId}/users`);
            obj[room.roomId] = Array.isArray(res.data.data) ? res.data.data.length : 0;
          } catch (err) {
            obj[room.roomId] = 0;
          }
        })
      );
      setRoomMemberCounts(obj);
    }
    if (Array.isArray(roomList) && roomList.length > 0) {
      fetchAllMemberCounts();
    }
  }, [roomList]);

  // "전체"(0) 또는 "안읽음"(1) 탭 필터링
  const filteredRooms = tabIdx === 0 ? roomList : roomList.filter(r => r.unreadCount > 0);

  // 참여자 수 기준 채팅방 유형 뱃지(1:1, Group) 반환용
  function TypeBadge({ count }) {
    if (!count) return null; // 참여자 데이터 없음
    if (count === 2)
      return <Chip label="1:1" size="small" color="primary" sx={{ fontWeight: 700, ml: 0.5 }} />;
    if (count > 2)
      return <Chip label="Group" size="small" color="success" sx={{ fontWeight: 700, ml: 0.5 }} />;
    return null;
  }

  return (
    <Box sx={{
      flex: "0 0 420px", minWidth: 350, maxWidth: 470,
      height: "calc(100vh - 56px - 32px)", background: "#fff",
      borderRight: "1px solid #e3e8ef", borderRadius: 0,
      display: "flex", flexDirection: "column", p: 0,
    }}>
      {/* 탭 영역 */}
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
      {/* 방 목록 */}
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
        {filteredRooms.length === 0 ? (
          <ListItem>
            <ListItemText
              primary={
                <Box sx={{ width: "100%", textAlign: "center", color: 'text.disabled', fontSize: 15 }}>
                  채팅방을 생성해서 대화를 시작해보세요
                </Box>
              }
            />
          </ListItem>
        ) : (
          filteredRooms.map(room => (
            <ListItem
              key={room.roomId}
              disablePadding
              sx={{
                mb: 1,
                borderBottom: "1px solid #e9eaeb"
              }}
            >
              <ListItemButton
                selected={selectedRoomId === room.roomId}
                onClick={() => setSelectedRoomId(room.roomId)}
                alignItems="flex-start"
                sx={{
                  borderRadius: 0,
                  background: selectedRoomId === room.roomId ? "#f3f6fa" : "#fff",
                  py: 2.4,
                  px: 1.2,
                  minHeight: "64px",
                  cursor: "pointer"
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
                    {/* 참여자수에 따라 1:1 또는 Group 뱃지 표시 */}
                    <TypeBadge count={roomMemberCounts[room.roomId]} />
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
                  <Box component="span" sx={{ display: "block" }}>
                    <Typography
                      component="span"
                      sx={{
                        fontSize: 14,
                        color: "#555",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "block"
                      }}
                    >
                      {room.lastMessageContent ? room.lastMessageContent : ""}
                    </Typography>
                    <Box component="span" sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                      <Typography
                        component="span"
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
                          component="span"
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
              </ListItemButton>
            </ListItem>
          ))
        )}
      </List>
    </Box>
  );
}

export default ChatRoomListPane;