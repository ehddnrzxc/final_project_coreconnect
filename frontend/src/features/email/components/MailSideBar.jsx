import React, { useContext, useEffect } from "react";
import {
  Box, Button, List, ListItem, ListItemButton, ListItemText, Typography,
  IconButton, Chip, Badge
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useNavigate } from "react-router-dom";
import { MailCountContext } from "../../../App";
import { emptyTrash, fetchDraftCount } from "../api/emailApi"; // ★ fetchDraftCount 추가!

const MailSideBar = () => {
  const navigate = useNavigate();
  // context 값 받아오기: draftCount, unreadCount, …, refreshDraftCount 등
  const {
    draftCount = 0,
    unreadCount = 0,
    refreshDraftCount = () => {},
    refreshUnreadCount = () => {},
  } = useContext(MailCountContext) || {};

  // ★ 이 부분에서 임시보관함 카운트를 동기화(앱 마운트/리프레시 시)
  useEffect(() => {
    // userEmail 정보를 각 필수 위치에서 받아와야 함 (혹은 fetchDraftCount를 직접 호출)
    // 보통 이 컨텍스트는 App에서 최신화해주므로, 여기선 effect 확인만 추가
  }, []);

  // 라우트 변경 함수
  const goTodayMailTab = () => navigate("/email?tab=today");
  const goUnreadMailTab = () => navigate("/email?tab=unread");
  const goAllMailTab = () => navigate("/email?tab=all");

  // 휴지통 비우기 핸들러
  const handleEmptyTrash = async (e) => {
    e.stopPropagation();
    if (!window.confirm("정말 휴지통을 비우시겠습니까? (되돌릴 수 없습니다)")) return;
    try {
      await emptyTrash();
      refreshDraftCount();
      refreshUnreadCount();
      alert("휴지통이 비워졌습니다.");
    } catch (err) {
      alert("휴지통 비우기 중 오류가 발생했습니다.");
      console.error(err);
    }
  };

  return (
    <Box
      sx={{
        width: 260, px: 2, py: 1, bgcolor: "#fff", height: "100vh",
        borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: 1
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Typography variant="h6" fontWeight={700} sx={{ flex: 1, fontSize: "1rem" }}>
          메일
        </Typography>
        <IconButton size="small" sx={{ color: "grey.700" }}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Box>
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
              <ListItemButton sx={{ borderRadius: 1, px: 1.3, py: 0.5 }} onClick={goUnreadMailTab}>
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
              <ListItemButton sx={{ borderRadius: 1, px: 1.3, py: 0.5 }} onClick={goTodayMailTab}>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body2">오늘의 메일</Typography>
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
                onClick={goAllMailTab}
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
            {/* 임시보관함 */}
            <ListItem disableGutters sx={{ py: 0.5, px: 0 }}>
              <ListItemButton
                sx={{ borderRadius: 1, px: 1.3, py: 0.5 }}
                onClick={() => navigate("/email/draftbox")}
              >
                <ListItemText primary={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography variant="body2">임시보관함</Typography>
                    {/* ★ draftCount 실시간 노출! */}
                    <Chip
                      size="small"
                      label={draftCount}
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
        {/* 지운편지함(휴지통) */}
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
                <Button variant="text" size="small" sx={{ fontSize: 12, px: 0.5 }} onClick={handleEmptyTrash}>
                  비우기
                </Button>
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Box>
    </Box>
  );
};

export default MailSideBar;