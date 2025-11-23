import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ChatPopover from './ChatPopover';

function ChatHeaderIcon({ unreadCount = 0, roomList = [] }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton 
        color="primary" 
        onClick={handleClick} 
        aria-label="open chat popover"
      >
        <Badge badgeContent={unreadCount} color="error">
          <ChatBubbleOutlineIcon fontSize="large" />
        </Badge>
      </IconButton>
      <ChatPopover
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        roomList={roomList}
      />
    </>
  );
}

export default ChatHeaderIcon;