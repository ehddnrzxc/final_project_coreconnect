import React, { useRef } from "react";
import { Box, TextField, IconButton, Button } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import SendIcon from "@mui/icons-material/Send";

function ChatInputBox({ inputValue, setInputValue, onSend }) {
  const inputRef = useRef();

  // Enter key 처리
  const handleInputKeyPress = (e) => {
    if (e.key === "Enter") onSend();
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <TextField
        variant="outlined"
        size="small"
        placeholder="메시지 입력"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleInputKeyPress}
        sx={{ flex: 1, background: "#fff", borderRadius: 2 }}
        inputRef={inputRef}
      />
      <IconButton color="primary">
        <AttachFileIcon />
      </IconButton>
      <Button
        variant="contained"
        color="success"
        onClick={onSend}
        sx={{ borderRadius: 2, px: 2, minWidth: 38 }}
      >
        <SendIcon />
      </Button>
    </Box>
  );
}

export default ChatInputBox;