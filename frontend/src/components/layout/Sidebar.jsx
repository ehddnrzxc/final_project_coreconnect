import { useState } from "react";
import { NavLink } from "react-router-dom";
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
import MailIcon from "@mui/icons-material/Mail";
import DescriptionIcon from "@mui/icons-material/Description";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PushPinIcon from "@mui/icons-material/PushPin";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import OrgChartDrawer from "../../features/organization/components/OrgChartDrawer";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

const items = [
  { to: "/home", label: "홈", icon: <HomeIcon fontSize="small" /> },
  { to: "/email", label: "메일", icon: <MailIcon fontSize="small" /> },
  {
    to: "/e-approval",
    label: "전자결재",
    icon: <DescriptionIcon fontSize="small" />,
  },
  { to: "/leave", label: "휴가", icon: <BeachAccessIcon fontSize="small" /> },
  {
    to: "/calendar",
    label: "캘린더",
    icon: <CalendarMonthIcon fontSize="small" />,
  },
  { to: "/board", label: "게시판", icon: <PushPinIcon fontSize="small" /> },
  { to: "/attendance", label: "근태", icon: <AccessTimeIcon fontSize="small" /> },
];

const Sidebar = () => {
  const [orgOpen, setOrgOpen] = useState(false);

  return (
    <Box
      component="aside"
      sx={{
        width: 80,
        bgcolor: "background.paper",
        borderRight: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
      }}
    >
      {/* 네비게이션 */}
      <Box sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
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
                    my: 0.5,
                    borderRadius: 2,
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    py: 1.5,
                    "& .MuiListItemIcon-root": {
                      minWidth: "auto",
                      mb: 0.5,
                    },
                    "& .MuiListItemText-root": {
                      m: 0,
                    },
                    "& .MuiListItemText-primary": {
                      fontSize: "0.75rem",
                    },
                    "&.Mui-selected": {
                      bgcolor: "transparent",
                      color: "primary.main",
                      "&:hover": {
                        bgcolor: "transparent",
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: "inherit" }}>
                    {it.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={it.label}
                    primaryTypographyProps={{
                      variant: "caption",
                      align: "center",
                    }}
                  />
                </ListItemButton>
              )}
            </NavLink>
          ))}
        </List>

        <Box sx={{ mt: "auto", px: 1, pb: 1 }}>
          <ListItemButton
            onClick={() => setOrgOpen(true)}
            sx={{
              borderRadius: 2,
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              py: 1.5,
              "& .MuiListItemIcon-root": {
                minWidth: "auto",
                mb: 0.5,
              },
              "& .MuiListItemText-root": {
                m: 0,
              },
              "& .MuiListItemText-primary": {
                fontSize: "0.75rem",
              },
            }}
          >
            <ListItemIcon sx={{ color: "inherit" }}>
              <AccountTreeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="조직도"
              primaryTypographyProps={{ variant: "caption", align: "center", sx: { whiteSpace: "nowrap" } }}
            />
          </ListItemButton>
        </Box>

      </Box>

      <Divider />
      <Box sx={{ py: 1.5, textAlign: "center" }}>
        <Typography variant="caption" color="text.secondary">
          v1.0
        </Typography>
      </Box>

      <OrgChartDrawer
        open={orgOpen}
        onClose={() => setOrgOpen(false)}
      />
    </Box>
  );
};

export default Sidebar;
