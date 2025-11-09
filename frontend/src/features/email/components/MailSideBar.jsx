import React, { useEffect, useState } from "react";
import { Box, Button, Divider, List, ListItem, ListItemButton, ListItemText, Typography, IconButton, Chip, Badge } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useNavigate } from "react-router-dom";
import { fetchUnreadCount, fetchInbox, getUserEmailFromStorage } from "../api/emailApi";

// 커스텀 훅: 오늘 안읽은 메일 수
function useTodayUnreadCount(userEmail) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!userEmail) return;
    fetchInbox(userEmail, 0, 100, "today").then(res => {
      const todayMails = res?.data?.data?.content || [];
      const unreadToday = todayMails.filter(m => !m.readYn).length;
      setCount(unreadToday);
    });
  }, [userEmail]);
  return count;
}

// 커스텀 훅: 받은 메일함 '안읽은' 전체 개수
function useUnreadCount(userEmail) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!userEmail) return;
    fetchUnreadCount(userEmail)
      .then(count => setCount(count || 0))
      .catch(() => setCount(0));
  }, [userEmail]);
  return count;
}

const MailSidebar = () => {
  const navigate = useNavigate();
  const userEmail = getUserEmailFromStorage();
  const unreadCount = useUnreadCount(userEmail); // 전체 받은메일함에서 안읽은 메일
  const todayUnreadCount = useTodayUnreadCount(userEmail); // 오늘 온 메일 중 안읽은 것

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
        {/* 즐겨찾기 */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: 13, color: "#999", flex: 1 }}>
              즐겨찾기
            </Typography>
            <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
          </Box>
          <List dense sx={{ p: 0 }}>
            <ListItem disableGutters sx={{ py: 0.5, px: 0 }}>
              <ListItemButton sx={{ borderRadius: 1, px: 1.3, py: 0.5 }}>
                <Box sx={{ display: "inline-block", pr: 0.7 }}>
                  <StarBorderIcon fontSize="small" />
                </Box>
                <ListItemText primary={<Typography variant="body2">중요 메일</Typography>} />
              </ListItemButton>
            </ListItem>
            <ListItem disableGutters sx={{ py: 0.5, px: 0 }}>
              <ListItemButton sx={{ borderRadius: 1, px: 1.3, py: 0.5 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body2">안읽은 메일</Typography>
                      <Badge
                        color="error"
                        badgeContent={unreadCount}
                        sx={{ "& .MuiBadge-badge": { fontSize: 12, height: 18, minWidth: 20, borderRadius: 9, ml: 1 } }}
                      />
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
            <ListItem disableGutters sx={{ py: 0.5, px: 0 }}>
              <ListItemButton sx={{ borderRadius: 1, px: 1.3, py: 0.5 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body2">오늘의 메일</Typography>
                      <Badge
                        color="primary"
                        badgeContent={todayUnreadCount}
                        sx={{ "& .MuiBadge-badge": { fontSize: 12, height: 18, minWidth: 20, borderRadius: 9, ml: 1 } }}
                      />
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>

        {/* 메일함 */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: 13, color: "#999", flex: 1 }}>
              메일함
            </Typography>
          </Box>
          <List dense sx={{ p: 0 }}>
            <ListItem disableGutters sx={{ py: 0.5, px: 0 }}>
              <ListItemButton
                sx={{ borderRadius: 1, px: 1.3, py: 0.5 }}
                onClick={() => navigate("/email")}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body2">받은메일함</Typography>
                      <Badge
                        color="primary"
                        badgeContent={unreadCount}
                        sx={{ "& .MuiBadge-badge": { fontSize: 12, height: 18, minWidth: 20, borderRadius: 9, ml: 1 } }}
                      />
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
            <ListItem disableGutters sx={{ py: 0.5, px: 0 }}>
              <ListItemButton
                sx={{ borderRadius: 1, px: 1.3, py: 0.5 }}
                onClick={() => navigate("/email/sent")}
              >
                <ListItemText primary={<Typography variant="body2">보낸메일함</Typography>} />
              </ListItemButton>
            </ListItem>
            <ListItem disableGutters sx={{ py: 0.5, px: 0 }}>
              <ListItemButton
                sx={{ borderRadius: 1, px: 1.3, py: 0.5 }}
                onClick={() => navigate("/email/trash")}
              >
                <ListItemText primary={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography variant="body2">임시보관함</Typography>
                    {/* 예시 숫자: 실제 API와 연동 필요 */}
                    <Chip
                      size="small"
                      label={13}
                      sx={{
                        ml: 1,
                        bgcolor: "#f2f4f8",
                        fontSize: 12,
                        color: "#222",
                        height: 18,
                        "& .MuiChip-label": { px: 0.8, py: 0.1 },
                      }}
                    />
                  </Box>
                } />
              </ListItemButton>
            </ListItem>
            <ListItem disableGutters sx={{ py: 0.5, px: 0 }}>
              <ListItemButton
                sx={{ borderRadius: 1, px: 1.3, py: 0.5 }}
                onClick={() => navigate("/email/reserved")}
              >
                <ListItemText primary={<Typography variant="body2">예약전송함</Typography>} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
        {/* 지운편지함 */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: 13, color: "#999", flex: 1 }}>
              지운편지함
            </Typography>
          </Box>
          <List dense sx={{ p: 0 }}>
            <ListItem disableGutters sx={{ py: 0.5, px: 0 }}>
              <ListItemButton
                sx={{ borderRadius: 1, px: 1.3, py: 0.5 }}
                onClick={() => navigate("/email/trash")}
              >
                <ListItemText primary={<Typography variant="body2">휴지통</Typography>} />
                <Button variant="text" size="small" sx={{ fontSize: 12, px: 0.5 }}>
                  비우기
                </Button>
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Box>
      {/* 아래에 필요한 추가 메뉴나 영역 있으면 여기에... */}
    </Box>
  );
};

export default MailSidebar;