import React from "react";
import {
  Box,
  IconButton,
  Popover,
  Typography,
  Stack,
  Avatar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";

export default function ProfilePopover({
  anchorEl,
  open,
  onClose,
  avatarUrl,
  userName,
  displayedJobGrade,
  displayedDept,
  displayedEmail,
  onOpenSettings,
  onLogout,
}) {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      PaperProps={{ sx: { borderRadius: 3, width: 280, p: 2, boxShadow: 4 } }}
    >
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 1,
        }}
      >
        <Avatar src={avatarUrl} alt={userName} sx={{ width: 64, height: 64 }} />
        <Typography variant="subtitle1" fontWeight={700}>
          {userName || "사용자"}
          {displayedJobGrade ? ` ${displayedJobGrade}` : ""}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {displayedDept}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {displayedEmail}
        </Typography>
      </Box>
      <Stack direction="row" justifyContent="center" spacing={4} sx={{ mt: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <IconButton
            onClick={onOpenSettings}
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
            }}
          >
            <SettingsIcon />
          </IconButton>
          <Typography variant="caption">설정</Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <IconButton
            onClick={() => {
              onClose();
              onLogout?.();
            }}
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
            }}
          >
            <LogoutIcon />
          </IconButton>
          <Typography variant="caption">로그아웃</Typography>
        </Box>
      </Stack>
    </Popover>
  );
}

