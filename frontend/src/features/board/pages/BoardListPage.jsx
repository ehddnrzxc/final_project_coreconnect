import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, List, ListItemButton, ListItemText, Pagination } from "@mui/material";
import { getBoardsByCategory, getBoardsOrdered } from "../api/boardAPI"; // ✅ 정렬 API까지 대응

const BoardListPage = () => {
  const { categoryId } = useParams();
  const [boards, setBoards] = useState([]);
  const [pageInfo, setPageInfo] = useState({ number: 0, totalPages: 1 });
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        // ✅ 카테고리별 조회 / 전체 조회 구분
        const res = categoryId
          ? await getBoardsByCategory(categoryId, pageInfo.number)
          : await getBoardsOrdered(pageInfo.number); // 전체 게시판 조회 시 정렬 포함
        setBoards(res.data.data.content);
        setPageInfo(res.data.data);
      } catch (err) {
        console.error("게시글 목록 불러오기 실패:", err);
      }
    })();
  }, [categoryId, pageInfo.number]);

  // ✅ 날짜 변환 함수 (월-일 시:분 포맷)
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        게시글 목록
      </Typography>

      <List>
        {boards.map((b) => (
          <ListItemButton
            key={b.id}
            onClick={() => navigate(`/board/detail/${b.id}`)}
            sx={{
              bgcolor: b.noticeYn ? "#f5f5f5" : "inherit", // 공지 회색
              borderRadius: 1,
              mb: 1,
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
              <Typography variant="body2" color="text.secondary">
                {b.categoryName || "전체 게시판"}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: b.noticeYn ? 700 : 500 }}>
                {b.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {b.writerName} / {formatDate(b.createdAt)}
              </Typography>
            </Box>
          </ListItemButton>
        ))}
      </List>

      {/* 페이지네이션 */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Pagination
          count={pageInfo.totalPages}
          page={pageInfo.number + 1}
          onChange={(e, v) => setPageInfo((p) => ({ ...p, number: v - 1 }))}
        />
      </Box>
    </Box>
  );
};

export default BoardListPage;