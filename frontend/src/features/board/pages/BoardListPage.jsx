import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  ListItemButton,
  Pagination,
  Stack,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  getBoardsByCategory,
  getBoardsOrdered,
  searchBoards,
} from "../api/boardAPI";
import LockIcon from "@mui/icons-material/Lock";
import CommentIcon from "@mui/icons-material/Comment";
import PushPinIcon from "@mui/icons-material/PushPin";
import { handleApiError } from "../../../utils/handleError";
import RecentViewedBoards from "./RecentViewedBoards";

const BoardListPage = () => {
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentPage = Number(searchParams.get("page")) || 0;
  const urlType = searchParams.get("type") || "";
  const urlKeyword = (searchParams.get("keyword") || "").trim();
  const urlSortType = searchParams.get("sortType") || "latest";
  const isSearchPage = urlType && urlKeyword !== "";

  const [boards, setBoards] = useState([]);
  const [pageInfo, setPageInfo] = useState({ number: 0, totalPages: 1 });
  const [searchType, setSearchType] = useState("title");
  const [keyword, setKeyword] = useState("");
  const [sortType, setSortType] = useState(urlSortType);

  // 게시글 불러오기
  useEffect(() => {
    (async () => {
      try {
        let res;
        if (isSearchPage) {
          res = await searchBoards(urlType, urlKeyword, currentPage);
        } else {
          if (categoryId) {
            res = await getBoardsByCategory(categoryId, sortType, currentPage);
          } else {
            res = await getBoardsOrdered(sortType, currentPage);
          }
        }
        setBoards(res.data.data.content);
        setPageInfo(res.data.data);
      } catch (err) {
        handleApiError(err, "게시글 목록 불러오기 실패");
      }
    })();
  }, [categoryId, currentPage, isSearchPage, urlType, urlKeyword, sortType]);

  // 날짜 포맷 함수
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  };

  // 페이지 이동
  const handlePageChange = (e, v) => {
    const newPage = v - 1;
    const queryBase = categoryId ? `/board/${categoryId}` : "/board";
    const sortQuery = `sortType=${sortType}`;
    if (isSearchPage) {
      navigate(
        `/board/search?type=${urlType}&keyword=${encodeURIComponent(
          urlKeyword
        )}&page=${newPage}`
      );
      return;
    }
    navigate(`${queryBase}?${sortQuery}&page=${newPage}`);
  };

  // 검색
  const handleSearch = () => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      if (categoryId)
        navigate(`/board/${categoryId}?sortType=${sortType}&page=0`);
      else navigate(`/board?sortType=${sortType}&page=0`);
      return;
    }
    navigate(
      `/board/search?type=${searchType}&keyword=${encodeURIComponent(
        trimmed
      )}&page=0`
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // 정렬 변경 핸들러
  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSortType(newSort);
    if (categoryId)
      navigate(`/board/${categoryId}?sortType=${newSort}&page=0`);
    else navigate(`/board?sortType=${newSort}&page=0`);
  };

  // ──────────────────────────────────────────────
  // UI
  // ──────────────────────────────────────────────
  return (
    <Box sx={{ display: "flex", gap: 3 }}>
      <Box sx={{ flex: 3 }}>
        {/* 상단: 정렬 + 검색 한 줄 */}
        <Stack
          direction="row"
          spacing={2}
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2, px: "10%" }}
        >
          {/* 정렬 */}
          <FormControl size="small" sx={{ width: 130 }}>
            <InputLabel id="sort-label">정렬</InputLabel>
            <Select
              labelId="sort-label"
              value={sortType}
              label="정렬"
              onChange={handleSortChange}
            >
              <MenuItem value="latest">최신순</MenuItem>
              <MenuItem value="views">조회순</MenuItem>
            </Select>
          </FormControl>

          {/* 검색 */}
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ width: 100 }}>
              <InputLabel>검색구분</InputLabel>
              <Select
                value={searchType}
                label="검색구분"
                onChange={(e) => setSearchType(e.target.value)}
              >
                <MenuItem value="title">제목</MenuItem>
                <MenuItem value="content">내용</MenuItem>
                <MenuItem value="author">작성자</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              placeholder="검색어를 입력하세요"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyPress}
              sx={{ width: 250 }}
            />

            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
              sx={{ minWidth: 70 }}
            >
              검색
            </Button>
          </Stack>
        </Stack>

        {/* 게시글 목록 */}
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
                <PushPinIcon
                  sx={{
                    fontSize: 22,
                    color: "#004d60",
                    transform: "rotate(45deg)",
                  }}
                />
              )}
              {b.privateYn && (
                <LockIcon sx={{ fontSize: 18, color: "#9e9e9e" }} />
              )}
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
              {b.writerName} / {formatDate(b.createdAt)} / 조회수{" "}
              {b.viewCount ?? 0}
            </Typography>
          </ListItemButton>
        ))}

        {/* 페이지네이션 */}
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Pagination
            count={Math.max(pageInfo.totalPages, 1)}
            page={currentPage + 1}
            onChange={handlePageChange}
          />
        </Box>
      </Box>

      {/* 오른쪽: 최근 본 게시글 */}
      <Box sx={{ flex: 1.1 }}>
        <RecentViewedBoards />
      </Box>
    </Box>
  );
};

export default BoardListPage;
