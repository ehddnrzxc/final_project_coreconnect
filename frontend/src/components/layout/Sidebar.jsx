import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from "@mui/material";

import HomeIcon from "@mui/icons-material/Home";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import DescriptionIcon from "@mui/icons-material/Description";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PushPinIcon from "@mui/icons-material/PushPin";

const items = [
  { to: "/home", label: "홈", icon: <HomeIcon fontSize="small" /> },
  { to: "/mail", label: "메일", icon: <MailOutlineIcon fontSize="small" /> },
  {
    to: "/e-approval",
    label: "전자결재",
    icon: <DescriptionIcon fontSize="small" />,
  },
  { to: "/works", label: "Works", icon: <WorkOutlineIcon fontSize="small" /> },
  {
    to: "/calendar",
    label: "캘린더",
    icon: <CalendarMonthIcon fontSize="small" />,
  },
  { to: "/board", label: "게시판", icon: <PushPinIcon fontSize="small" /> },
];

const Sidebar = () => {
  return (
    <Box
      component="aside"
      sx={{
        width: 220,
        bgcolor: "#ffffff",
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 브랜드 로고 */}
      <Box
        component={Link}
        to="/home"
        sx={{
          textDecoration: "none",
          color: "#00a0e9",
          cursor: "pointer",
          px: 2,
          py: 2,
          fontSize: 18,
          fontWeight: 700,
          borderBottom: "1px solid #e5e7eb",
          "&:hover": {
            bgcolor: "#f3f4f6",
          },
        }}
      >
        CoreConnect
      </Box>

      {/* 네비게이션 */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <List sx={{ py: 1 }}>
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              {({ isActive }) => (
                <ListItemButton
                  selected={isActive}
                  sx={{
                    mx: 1,
                    mb: 0.5,
                    borderRadius: 1.5,
                    "&.Mui-selected": {
                      bgcolor: "#00a0e9",
                      color: "#ffffff",
                      "&:hover": {
                        bgcolor: "#0090d2",
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
                    {it.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={it.label}
                    primaryTypographyProps={{ variant: "body2" }}
                  />
                </ListItemButton>
              )}
            </NavLink>
          ))}
        </List>
      </Box>

      <Divider />
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          v0.1 • demo
        </Typography>
      </Box>
    </Box>
  );
};

export default Sidebar;