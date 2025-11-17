import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import ChatRoomList from './ChatRoomList';
import ChatRoomPane from './ChatRoomPane';
import axios from 'axios';

function ChatMain({ onClose }) {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    axios.get('/api/v1/chat/rooms')
      .then(res => setRooms(res.data))
      .catch(() => setRooms([]));
  }, []);

  return (
    <Box sx={{
      position: 'fixed', top: 0, right: 0, height: '100vh', width: 640,
      bgcolor: '#fff', boxShadow: '-4px 0 16px #0002',
      display: 'flex', zIndex: 2000
    }}>
      <ChatRoomList
        rooms={rooms}
        onSelect={r => setSelectedRoom(r)}
        selectedRoomId={selectedRoom?.id}
      />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Box sx={{ p: 0.5, justifyContent: 'flex-end', display: 'flex' }}>
          <IconButton onClick={onClose} color="default" size="large">
            <CloseIcon />
          </IconButton>
        </Box>
        <ChatRoomPane room={selectedRoom} />
      </Box>
    </Box>
  );
}

export default ChatMain;