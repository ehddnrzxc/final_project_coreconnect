import React from "react";
import { Box, Typography, List, ListItemButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function OverviewView({ onNavigateToProfile }) {
  const theme = useTheme();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        내 정보 관리
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
            onClick={onNavigateToProfile}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 0.5,
            }}
          >
            <Typography variant="subtitle1">내 프로필 관리</Typography>
            <Typography variant="body2" color="text.secondary">
              사용자의 프로필을 관리합니다.
            </Typography>
          </ListItemButton>
        </List>
      </Box>
    </Box>
  );
}

