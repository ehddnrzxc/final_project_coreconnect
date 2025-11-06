import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  ListItemButton,
  Pagination,
  Stack,
} from "@mui/material";
import { getBoardsByCategory, getBoardsOrdered } from "../api/boardAPI";
import LockIcon from "@mui/icons-material/Lock";
import CommentIcon from "@mui/icons-material/Comment";
import coreconnectLogo from "../../../assets/coreconnect-logo.png";
import { handleApiError } from "../../../utils/handleError"; // ✅ 추가됨

const BoardListPage = () => {
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentPage = Number(searchParams.get("page")) || 0;
  const [boards, setBoards] = useState([]);
  const [pageInfo, setPageInfo] = useState({ number: 0, totalPages: 1 });

  useEffect(() => {
    (async () => {
      try {
        const res = categoryId
          ? await getBoardsByCategory(categoryId, currentPage)
          : await getBoardsOrdered(currentPage);
        setBoards(res.data.data.content);
        setPageInfo(res.data.data);
      } catch (err) {
        handleApiError(err, "게시글 목록 불러오기 실패");
      }
    })();
  }, [categoryId, currentPage]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  };

  const handlePageChange = (e, v) => {
    const newPage = v - 1;
    if (categoryId) {
      navigate(`/board/${categoryId}?page=${newPage}`);
    } else {
      navigate(`/board?page=${newPage}`);
    }
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
              : "white",
            border: "1px solid #e0e0e0",
            borderRadius: 1,
            mb: 1.2,
            py: 1.2,
            width: "80%",
            mx: "auto",
            flexDirection: "column",
            alignItems: "flex-start",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            transition: "background-color 0.2s ease",
            "&:hover": {
              bgcolor: b.pinned
                ? "primary.light"
                : b.noticeYn
                ? "#e0e0e0"
                : "#fafafa",
            },
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary">
              {b.categoryName || "전체 게시판"}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <CommentIcon sx={{ fontSize: 15, color: "#616161" }} />
              <Typography variant="caption" color="text.secondary">
                {b.replyCount ?? 0}
              </Typography>
            </Stack>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1} sx={{ width: "100%" }}>
            {b.pinned && (
              <img src={coreconnectLogo} alt="pinned" style={{ width: 26, height: 26 }} />
            )}
            {b.privateYn && <LockIcon sx={{ fontSize: 18, color: "#9e9e9e" }} />}
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                flexGrow: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {b.title}
            </Typography>
          </Stack>

          {b.content && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
                mb: 0.5,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
              }}
            >
              {b.content}
            </Typography>
          )}

          <Typography variant="caption" color="text.secondary">
            {b.writerName} / {formatDate(b.createdAt)} / 조회수 {b.viewCount ?? 0}
          </Typography>
        </ListItemButton>
      ))}

      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Pagination
          count={Math.max(pageInfo.totalPages, 1)}
          page={currentPage + 1}
          onChange={handlePageChange}
        />
      </Box>
    </Box>
  );
};

export default BoardListPage;
