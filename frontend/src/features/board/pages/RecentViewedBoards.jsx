import React, { useEffect, useState } from "react"; // React 훅: 상태관리, 데이터 로드
import { useNavigate } from "react-router-dom"; // 페이지 이동용 훅
import { getRecentViewedBoards } from "../api/boardAPI"; // 최근 본 게시글 API
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material"; // MUI: 기본 UI 구성요소

const RecentViewedBoards = () => {
  const [boards, setBoards] = useState([]); // 최근 본 게시글 목록 상태
  const navigate = useNavigate(); // 상세 페이지 이동용

  useEffect(() => {
    // 컴포넌트 마운트 시 최근 게시글 불러오기
    (async () => {
      try {
        const res = await getRecentViewedBoards();
        setBoards(res.data.data || []);
      } catch (err) {
        console.error("최근 게시글 조회 실패:", err);
      }
    })();
  }, []);

  const formatDate = (dateStr) => {
    // 날짜를 한국어 형식으로 변환
    const d = new Date(dateStr);
    return d.toLocaleString("ko-KR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  return (
    <Box sx={{ width: "100%", mt: 4 }}> 
      <Typography variant="h6" sx={{ mb: 1 }}>
        🔍 최근 본 게시글
      </Typography>

      {boards.length === 0 ? (
        // 게시글이 없을 때
        <Typography color="text.secondary">
          최근 본 게시글이 없습니다.
        </Typography>
      ) : (
        // 게시글이 있을 때 목록 표시
        <Paper variant="outlined" sx={{ p: 1 }}>
          <List>
            {boards.map((b, idx) => (
              <React.Fragment key={b.id}>
                <ListItem
                  button
                  onClick={() => navigate(`/board/detail/${b.id}`)}
                  sx={{ py: 1, "&:hover": { bgcolor: "#f5f5f5" } }}
                >
                  <ListItemText
                    primary={b.title} 
                    secondary={`${b.writerName} · ${formatDate(
                      b.createdAt
                    )} · 조회수 ${b.viewCount}`} 
                  />
                </ListItem>
                {idx < boards.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default RecentViewedBoards;
