import React from "react";
import { Box, Typography } from "@mui/material";
import ChatMessageList from "./ChatMessageList";
import ChatInputBox from "./ChatInputBox";

export default function ChatRoomContainer({
  roomId,
  messages,
  userName,
  inputValue,
  setInputValue,
  onSend
}) {
  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        채팅방 #{roomId}
      </Typography>
      <ChatMessageList messages={messages} userName={userName} />
      <ChatInputBox
        inputValue={inputValue}
        setInputValue={setInputValue}
        onSend={onSend}
      />
    </Box>
  );
}