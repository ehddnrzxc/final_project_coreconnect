import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../../../components/ui/Card";
import { Button, Typography, List, ListItem, ListItemText, Box } from "@mui/material";
import { getBoardsByLatestOnly } from "../api/dashboardAPI";

export default function RecentBoardsCard() {
  const navigate = useNavigate();
  const [recentBoards, setRecentBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  // 전체게시판 최근글 10개 가져오기 (공지/상단고정 구분 없이 최신순만)
  useEffect(() => {
    (async () => {
      try {
        const res = await getBoardsByLatestOnly(0, 10);
        setRecentBoards(res.data?.content || []);
      } catch (err) {
        console.error("게시글 목록 불러오기 실패:", err);
        setRecentBoards([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 날짜 포맷 함수 (MM-DD 형식)
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  };

  return (
    <Card
      title="전체게시판 최근글"
      right={
        <Button
          component={Link}
          to="/board"
          size="small"
          sx={{ textTransform: "none" }}
        >
          전체보기
        </Button>
      }
    >
      {loading ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          로딩 중...
        </Typography>
      ) : recentBoards.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          게시글이 없습니다.
        </Typography>
      ) : (
        <List dense sx={{ pl: 2, listStyleType: "disc" }}>
          {recentBoards.map((board) => (
            <ListItem
              key={board.id}
              data-grid-cancel="true"
              sx={{
                display: "list-item",
                px: 0,
                py: 0.5,
                cursor: "pointer",
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
              onClick={() => navigate(`/board/detail/${board.id}`)}
            >
              <ListItemText
                primary={
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1.5,
                      width: "100%",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      {board.pinned && "📌 "}
                      {board.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ flexShrink: 0 }}
                    >
                      {formatDate(board.createdAt)}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Card>
  );
}

