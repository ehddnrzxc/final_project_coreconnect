import React from 'react';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

function ChatHeaderIcon({ onClick, unreadCount = 0 }) {
  return (
    <IconButton color="primary" onClick={onClick} aria-label="open chat panel">
      <Badge badgeContent={unreadCount} color="error">
        <ChatBubbleOutlineIcon fontSize="large" />
      </Badge>
    </IconButton>
  );
}

export default ChatHeaderIcon;