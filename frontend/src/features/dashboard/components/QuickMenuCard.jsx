import React from "react";
import { Link } from "react-router-dom";
import Card from "../../../components/ui/Card";
import { Box, Button, Grid, Typography, useTheme } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ArticleIcon from "@mui/icons-material/Article";
import DescriptionIcon from "@mui/icons-material/Description";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import MessageIcon from "@mui/icons-material/Message";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

export default function QuickMenuCard() {
  const theme = useTheme();
  const menuItems = [
    { label: "메일쓰기", icon: <EditIcon />, path: "/email/write" },
    { label: "게시판 글쓰기", icon: <ArticleIcon />, path: "/board/new" },
    { label: "전자결재 작성", icon: <DescriptionIcon />, path: "/e-approval" },
    { label: "휴가 신청", icon: <BeachAccessIcon />, path: "/leave" },
    { label: "채팅", icon: <MessageIcon />, path: "/chat" },
    { label: "캘린더", icon: <CalendarMonthIcon />, path: "/calendar" },
  ];

  const firstRow = menuItems.slice(0, 3);
  const secondRow = menuItems.slice(3, 6);

  const renderButton = (item) => (
    <Grid item xs={4} key={item.label}>
      <Button
        component={Link}
        to={item.path}
        fullWidth
        variant="outlined"
        size="small"
        sx={{
          flexDirection: "column",
          py: 1.2,
          textTransform: "none",
          borderRadius: 2,
          bgcolor: theme.palette.background.secondary,
          borderColor: "transparent",
          color: "text.primary",
          "&:hover": {
            bgcolor: theme.palette.mode === "dark" 
              ? "rgba(255, 255, 255, 0.1)" 
              : "rgba(0, 0, 0, 0.05)",
            borderColor: "transparent",
          },
        }}
      >
        <Box sx={{ fontSize: 24, mb: 0.5, color: "primary.main" }}>
          {item.icon}
        </Box>
        <Typography variant="caption">{item.label}</Typography>
      </Button>
    </Grid>
  );

  return (
    <Card title="Quick Menu">
      <Grid container columnSpacing={2.5} rowSpacing={2.5}>
        {menuItems.map((item) => (
          <Grid item xs={4} key={item.label}>
            <Button
              component={Link}
              to={item.path}
              fullWidth
              variant="outlined"
              size="small"
              sx={{
                flexDirection: "column",
                py: 1.2,
                textTransform: "none",
                borderRadius: 2,
                bgcolor: theme.palette.background.secondary,
                borderColor: "transparent",
                color: "text.primary",
                "&:hover": { bgcolor: "action.hover", borderColor: "transparent" },
              }}
            >
              <Box sx={{ fontSize: 24, mb: 0.5, color: "primary.main" }}>{item.icon}</Box>
              <Typography variant="caption">{item.label}</Typography>
            </Button>
          </Grid>
        ))}
      </Grid>
    </Card>
  );
}

