import React, { useState } from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Badge from '@mui/material/Badge';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import ChatRoomCreateDialog from './ChatRoomCreateDialog';

function ChatRoomList({ rooms, onSelect, selectedRoomId, onRoomCreated }) {
  const [createOpen, setCreateOpen] = useState(false);

  // 방 생성 로직 (API 필요시 fetch/axios 구현)
  const handleCreateRoom = async (roomName) => {
    // 실제 생성 요청하는 예시. (API 주소/파라미터에 맞게 수정 필요)
    try {
      // 만약 accessToken이 필요하면 localStorage에서 꺼내 사용: 
      const accessToken = localStorage.getItem("accessToken");
      const res = await fetch('/api/v1/chat/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : undefined
        },
        body: JSON.stringify({ name: roomName })
      });
      if (!res.ok) {
        alert("채팅방 생성 실패");
        return;
      }
      const data = await res.json();
      // 생성된 방 정보: data.data (API 구조에 따라 조정)
      onRoomCreated && onRoomCreated(data.data);
    } catch (error) {
      alert("채팅방 생성 에러: " + error.message);
    }
    setCreateOpen(false);
  };

  return (
    <Box sx={{ width: 280, borderRight: 1, borderColor: 'divider', bgcolor: '#f9f9fa', height: '100%', position: "relative" }}>
      <Typography variant="h6" sx={{ p: 2, fontWeight: 'bold', pb: 0 }}>
        채팅방 목록
        {/* + 버튼: 오른쪽 상단에 둡니다 */}
        <IconButton
          color="primary"
          size="small"
          sx={{ ml: 1, float: "right", mt: "-5px" }}
          onClick={() => setCreateOpen(true)}
        >
          <AddIcon />
        </IconButton>
      </Typography>
      <List>
        {(!rooms || rooms.length === 0) ? (
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
          rooms.map(room => (
            <ListItem disablePadding key={room.id}>
              <ListItemButton
                selected={selectedRoomId === room.id}
                onClick={() => onSelect(room)}
              >
                <ListItemText
                  primary={
                    <span style={{ fontWeight: selectedRoomId === room.id ? 700 : 400 }}>
                      {room.name}
                    </span>
                  }
                />
                {room.unreadCount > 0 && (
                  <Badge color="primary" badgeContent={room.unreadCount} sx={{ ml: 1 }} />
                )}
              </ListItemButton>
            </ListItem>
          ))
        )}
      </List>
      {/* 다이얼로그 popup(모달) */}
      <ChatRoomCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreateRoom}
      />
    </Box>
  );
}

export default ChatRoomList;