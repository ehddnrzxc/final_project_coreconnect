import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, ListItemButton, Pagination } from "@mui/material";
import { getBoardsByCategory, getBoardsOrdered } from "../api/boardAPI";
import LockIcon from "@mui/icons-material/Lock"; // 🔒 자물쇠 아이콘 추가
import coreconnectLogo from "../../../assets/coreconnect-logo.png"; // 로고 경로 확인

const BoardListPage = () => {
  const { categoryId } = useParams();
  const [boards, setBoards] = useState([]);
  const [pageInfo, setPageInfo] = useState({ number: 0, totalPages: 1 });
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = categoryId
          ? await getBoardsByCategory(categoryId, pageInfo.number)
          : await getBoardsOrdered(pageInfo.number);
        setBoards(res.data.data.content);
        setPageInfo(res.data.data);
      } catch (err) {
        console.error("게시글 목록 불러오기 실패:", err);
      }
    })();
  }, [categoryId, pageInfo.number]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        게시글 목록
      </Typography>

      {boards.map((b) => (
        <ListItemButton
          key={b.id}
          onClick={() => navigate(`/board/detail/${b.id}`)}
          sx={{
            bgcolor: b.pinned
              ? "primary.main"
              : b.noticeYn
              ? "#d9d9d9"
              : "inherit",
            borderRadius: 1,
            mb: 1.2,
            py: 0.2,
            width: "80%",
            mx: "auto",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <Typography variant="body2" color="text.secondary">
              {b.categoryName || "전체 게시판"}
            </Typography>

            {/* 제목 + 아이콘 표시 영역 */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {/* 상단고정 아이콘 */}
              {b.pinned && (
                <img
                  src={coreconnectLogo}
                  alt="pinned"
                  style={{ width: 30, height: 30 }}
                />
              )}
              {/* 비공개 아이콘 */}
              {b.privateYn && (
                <LockIcon sx={{ fontSize: 18, color: "#616161" }} />
              )}

              <Typography
                variant="subtitle1"
                sx={{ fontWeight: b.noticeYn ? 700 : 500 }}
              >
                {b.title}
              </Typography>
            </Box>

            {/* 작성자, 날짜, 조회수 */}
            <Typography variant="caption" color="text.secondary">
              {b.writerName} / {formatDate(b.createdAt)} / 조회수{" "}
              {b.viewCount ?? 0}
            </Typography>
          </Box>
        </ListItemButton>
      ))}

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
