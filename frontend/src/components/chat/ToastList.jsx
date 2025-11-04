import React, { useEffect, useState } from "react";
import { Box, Snackbar, Slide, Paper, Typography, Badge } from "@mui/material";

// formatTime 함수는 ChatLayout에서 import 해서 prop으로 넘겨주거나, ToastList에서 직접 선언해도 됨
function TransitionLeft(props) {
  return <Slide {...props} direction="left" />;
}

const ToastList = ({ rooms, formatTime }) => {
  const [openToasts, setOpenToasts] = useState([]);

  useEffect(() => {
    setOpenToasts(
      rooms
        .filter(room => room.unreadCount > 0)
        .map(room => ({ roomId: room.roomId, open: true }))
    );
  }, [rooms]);

  useEffect(() => {
    if (openToasts.length > 0) {
      const timers = openToasts.map((toast) =>
        setTimeout(() => {
          setOpenToasts(prev => prev.map(t =>
            t.roomId === toast.roomId ? {...t, open: false} : t
          ));
        }, 5000)
      );
      return () => timers.forEach(timerId => clearTimeout(timerId));
    }
  }, [openToasts]);

  return (
    <>
      {rooms.filter(room => room.unreadCount > 0).map(room => {
        const toastOpen = openToasts.find(t => t.roomId === room.roomId)?.open ?? false;
        return (
          <Snackbar
            key={room.roomId}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            open={toastOpen}
            TransitionComponent={TransitionLeft}
            autoHideDuration={5000}
          >
            <Paper elevation={8} sx={{
              background: "#3b475a", color: "#fff", minWidth: 280, maxWidth: 420,
              px: 2, py: 2, borderRadius: 2
            }}>
              <Box sx={{ fontWeight: 700, fontSize: 15, mb: 0.7, display: "flex", alignItems: "center", gap: 1 }}>
                <Badge
                  badgeContent={room.unreadCount > 1 ? `+${room.unreadCount - 1}` : null}
                  color="warning"
                  sx={{
                    mr: 1,
                    "& .MuiBadge-badge": {
                      background: "#f6c745", color: "#222", borderRadius: "8px", fontWeight: 700, fontSize: "14px"
                    }
                  }}
                />
                <span>{room.lastUnreadMessageContent}</span>
              </Box>
              <Box sx={{ fontSize: 13, display: "flex", gap: 1.3, alignItems: "center", mb: 0.6 }}>
                <span>{room.lastUnreadMessageSenderName}</span>
                <span>{formatTime ? formatTime(room.lastUnreadMessageTime) : ""}</span>
              </Box>
              <Box sx={{ fontSize: 12, color: "#abd0ff", opacity: 0.83 }}>
                [{room.roomName}]
              </Box>
            </Paper>
          </Snackbar>
        );
      })}
    </>
  );
};

export default ToastList;