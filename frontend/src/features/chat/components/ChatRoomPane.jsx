import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

function ChatRoomPane({ room }) {
  if (!room) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography color="text.secondary" variant="h5" fontWeight={500}>
          채팅방을 선택해주세요.
        </Typography>
      </Box>
    );
  }

  // (메시지, 입력창 등은 이후 단계에서 추가)
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#f5f7fa', height: '100%' }}>
      <Box sx={{ p: 2, fontWeight: 700, borderBottom: 1, borderColor: 'divider', bgcolor: '#f8f8fa' }}>
        {room.name}
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        <Typography color="text.disabled" align="center" mt={4}>
          (채팅 메시지 영역 - 이후 구현)
        </Typography>
      </Box>
    </Box>
  );
}

export default ChatRoomPane;