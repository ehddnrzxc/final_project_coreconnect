import React, { useState, useEffect } from "react";
import { Snackbar, Slide, Paper, Box, Typography, Badge } from "@mui/material";

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
      const timers = openToasts.map(toast =>
        setTimeout(() => {
          setOpenToasts(prev =>
            prev.map(t =>
              t.roomId === toast.roomId ? { ...t, open: false } : t
            )
          );
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
                  badgeContent={room.unreadCount}
                  color="error"
                  sx={{
                    mr: 1,
                    "& .MuiBadge-badge": {
                      background: "#f6c745",
                      color: "#222",
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: "14px"
                    }
                  }}
                />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {room.lastUnreadMessageContent}
                </Typography>
              </Box>
              <Box sx={{ fontSize: 13, display: "flex", gap: 1.3, alignItems: "center", mb: 0.6 }}>
                <Typography variant="body2">{room.lastUnreadMessageSenderName}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {formatTime ? formatTime(room.lastUnreadMessageTime) : ""}
                </Typography>
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