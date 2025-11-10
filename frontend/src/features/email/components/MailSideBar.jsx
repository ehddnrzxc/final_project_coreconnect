import React, { useContext } from "react";
import {
  Box, Button, List, ListItem, ListItemButton, ListItemText, Typography,
  IconButton, Chip, Badge
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useNavigate } from "react-router-dom";
import { MailCountContext } from "../../../App";

// 오늘의 안읽은 메일 수 (props나 context에서 내려받는 게 더 실전적이나 참고용 남김)
const useTodayUnreadCount = (userEmail) => {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    if (!userEmail) return;
    // fetchInbox 등 구체 함수는 api/emailApi에서 import 필요
    fetchInbox(userEmail, 0, 100, "today").then(res => {
      const todayMails = res?.data?.data?.content || [];
      const unreadToday = todayMails.filter(m => !m.readYn).length;
      setCount(unreadToday);
    });
  }, [userEmail]);
  return count;
};

const MailSidebar = ({ unreadCount, refreshUnreadCount }) => {
  const navigate = useNavigate();
  const { draftCount } = useContext(MailCountContext); // context로 임시보관 개수를 받음
  // 아래 두 줄이 사이드바에 필요하다면 사용(실전에서는 props/context로 내리는 게 더 나음)
  // const userEmail = getUserEmailFromStorage();
  // const todayUnreadCount = useTodayUnreadCount(userEmail);

  // 아래 함수를 메일탭별 라우트에 연결
  const goTodayMailTab = () => navigate("/email?tab=today");
  const goUnreadMailTab = () => navigate("/email?tab=unread");
  const goAllMailTab = () => navigate("/email?tab=all");

  return (
    <Box
      sx={{
        width: 260, px: 2, py: 1, bgcolor: "#fff", height: "100vh",
        borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: 1
      }}
    >
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
                      {/* todayUnreadCount가 필요하다면 아래처럼 받으세요 */}
                      {/* <Badge
                        color="primary"
                        badgeContent={todayUnreadCount}
                        sx={{ "& .MuiBadge-badge": { fontSize: 12, height: 18, minWidth: 20, borderRadius: 9, ml: 1 } }}
                      /> */}
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
                    <Chip
                      size="small"
                      label={draftCount} // draftBoxTotalCount 대신 context값 사용!
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
                <Button variant="text" size="small" sx={{ fontSize: 12, px: 0.5 }}>
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

export default MailSidebar;