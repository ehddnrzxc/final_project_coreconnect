import React from "react";
import { Box, Typography, List, ListItemButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function SecurityView({ onNavigateToPassword }) {
  const theme = useTheme();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        보안설정
      </Typography>
      <Box
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <List disablePadding>
          <ListItemButton
            onClick={onNavigateToPassword}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 0.5,
            }}
          >
            <Typography variant="subtitle1">비밀번호 변경</Typography>
            <Typography variant="body2" color="text.secondary">
              비밀번호를 변경합니다.
            </Typography>
          </ListItemButton>
        </List>
      </Box>
    </Box>
  );
}

