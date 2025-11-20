import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Stack,
  Typography,
  Avatar,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import dayjs from "dayjs";

export default function UserProfileModal({ open, onClose, user }) {
  if (!user) return null;

  const formatBirthday = (birthday) => {
    if (!birthday) return "-";
    const date = dayjs(birthday);
    return date.format("YYYY-MM-DD");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: 400,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          pt: 3,
          pb: 2,
        }}
      >
        <Typography variant="h5">프로필 정보</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ px: 3, py: 3 }}>
        <Box>
          {/* 프로필 헤더 */}
          <Stack
            direction="row"
            spacing={3}
            alignItems="center"
            sx={{ mb: 3 }}
          >
            <Avatar
              src={user.profileImageUrl}
              alt={user.name}
              sx={{ width: 72, height: 72 }}
            />
            <Box>
              <Typography variant="h6">{user.name || "-"}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user.deptName || "부서 없음"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email || "-"}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* 프로필 상세 정보 */}
          <Stack spacing={2}>
            {[
              { label: "사번", value: user.employeeNumber || "-" },
              { label: "아이디/이메일", value: user.email || "-" },
              { label: "직책·부서", value: user.deptName || "-" },
              { label: "생일", value: formatBirthday(user.birthday) },
            ].map((item) => (
              <Box key={item.label} sx={{ display: "flex", gap: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ width: 110 }}
                >
                  {item.label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ flex: 1, wordBreak: "break-word" }}
                >
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

