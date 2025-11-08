import React from "react";
import { Box, Button, Divider, InputBase, List, ListItem, ListItemButton, ListItemText, Typography, IconButton, Chip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useNavigate } from "react-router-dom";

const sidebarItems = [
  {
    title: "즐겨찾기",
    items: [
      { label: "중요 메일", icon: <StarBorderIcon fontSize="small" sx={{ mr: 0.5 }} /> },
      { label: "안읽은 메일" },
      { label: "오늘의 메일" },
    ],
    action: <IconButton size="small"><EditIcon fontSize="small" /></IconButton>,
  },
  {
    title: "메일함",
    items: [
      { label: "받은메일함", chip: 1, to: "/email" },
      { label: "보낸메일함", to: "/email/sent" },
      { label: "임시보관함", chip: 13, to: "/email/trash" },
      { label: "예약전송함", to: "/email/reserved" },
    ],
  },
  {
    title: "지운편지함",
    items: [
      { label: "휴지통", action: <Button variant="text" size="small" sx={{ fontSize: 12, px: 0.5 }}>비우기</Button>, to: "/email/trash" },
    ],
  },
];

const MailSidebar = () => {
  const navigate = useNavigate();
  

  return (
    <Box sx={{ width: 260, px: 2, py: 1, bgcolor: "#fff", height: "100vh", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: 1 }}>
      {/* 상단 타이틀, 옵션 */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Typography variant="h6" fontWeight={700} sx={{ flex: 1, fontSize: "1rem" }}>
          메일
        </Typography>
        <IconButton size="small" sx={{ color: "grey.700" }}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Box>
      {/* 메일쓰기 버튼 */}
      <Box sx={{ mb: 1 }}>
        <Button
          variant="outlined"
          fullWidth
          size="small"
          onClick={() => navigate("/email/write")}
          sx={{
            fontWeight: 700,
            borderRadius: 2,
            bgcolor: "#f6f7fc",
            borderColor: "#e1e3ea",
            py: 1,
          }}
        >
          메일쓰기
        </Button>
      </Box>
      {/* 즐겨찾기/메일함/지운편지함 섹션 */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {sidebarItems.map((section) => (
          <Box key={section.title} sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: section.title !== "메일함" ? 0.5 : 1 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: 13, color: "#999", flex: 1 }}>
                {section.title}
              </Typography>
              {section.action}
            </Box>
            <List dense sx={{ p: 0 }}>
              {section.items.map((item, i) => (
                <ListItem key={item.label} disableGutters secondaryAction={item.action} sx={{ py: 0.5, px: 0 }}>
                  <ListItemButton
                    sx={{ borderRadius: 1, px: 1.3, py: 0.5 }}
                    onClick={() => {
                      if (item.to) navigate(item.to);
                    }}
                  >
                    {item.icon && <Box sx={{ display: "inline-block", pr: 0.7 }}>{item.icon}</Box>}
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Typography variant="body2">{item.label}</Typography>
                          {item.chip && (
                            <Chip
                              size="small"
                              label={item.chip}
                              sx={{
                                ml: 1,
                                bgcolor: "#f2f4f8",
                                fontSize: 12,
                                color: "#222",
                                height: 18,
                                "& .MuiChip-label": { px: 0.8, py: 0.1 },
                              }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </Box>
      {/* 아래에 필요한 추가 메뉴나 영역 있으면 여기에... */}
    </Box>
  );
};

export default MailSidebar;