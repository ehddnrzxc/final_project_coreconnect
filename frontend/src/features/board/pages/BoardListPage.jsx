import React, { useEffect, useState } from "react"; // React 훅: 상태관리, 생명주기 제어
import { useParams, useNavigate, useSearchParams } from "react-router-dom"; // 라우터 훅: 파라미터, 네비게이션, 쿼리스트링 관리
import {
  Box,
  Typography,
  ListItemButton,
  Pagination,
  Stack,
} from "@mui/material"; // MUI: 레이아웃, 텍스트, 버튼형 리스트, 페이지네이션
import { getBoardsByCategory, getBoardsOrdered } from "../api/boardAPI"; // 게시글 목록 관련 API
import LockIcon from "@mui/icons-material/Lock"; // 비공개 아이콘
import CommentIcon from "@mui/icons-material/Comment"; // 댓글 개수 아이콘
import coreconnectLogo from "../../../assets/coreconnect-logo.png"; // 고정글 로고 이미지
import { handleApiError } from "../../../utils/handleError"; // 공통 에러 처리 함수

// 게시글 목록 페이지 컴포넌트
const BoardListPage = () => {
  const { categoryId } = useParams(); // URL 파라미터에서 카테고리 ID 추출
  const [searchParams] = useSearchParams(); // 쿼리스트링 읽기
  const navigate = useNavigate(); // 페이지 이동 훅

  // 현재 페이지 번호 (기본값 0)
  const currentPage = Number(searchParams.get("page")) || 0;

  // 게시글 목록과 페이징 정보 상태
  const [boards, setBoards] = useState([]);
  const [pageInfo, setPageInfo] = useState({ number: 0, totalPages: 1 });

  // 페이지 진입 시 또는 카테고리/페이지 변경 시 게시글 불러오기
  useEffect(() => {
    (async () => {
      try {
        const res = categoryId
          ? await getBoardsByCategory(categoryId, currentPage) // 카테고리별 게시글 조회
          : await getBoardsOrdered(currentPage); // 전체 게시글 조회 (공지+최신순)
        setBoards(res.data.data.content); // 게시글 목록 저장
        setPageInfo(res.data.data); // 페이징 정보 저장
      } catch (err) {
        handleApiError(err, "게시글 목록 불러오기 실패"); // 에러 처리
      }
    })();
  }, [categoryId, currentPage]);

  // 날짜 형식 변환 함수
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  };

  // 페이지 이동 핸들러
  const handlePageChange = (e, v) => {
    const newPage = v - 1; // Pagination은 1부터 시작하므로 -1 보정
    if (categoryId) {
      navigate(`/board/${categoryId}?page=${newPage}`); // 카테고리 게시판 이동
    } else {
      navigate(`/board?page=${newPage}`); // 전체 게시판 이동
    }
  };

  return (
    <Box> {/* MUI: 전체 레이아웃 컨테이너 */}
      {/* 페이지 제목 */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        게시글 목록
      </Typography>

      {/* 게시글 카드 목록 렌더링 */}
      {boards.map((b) => (
        <ListItemButton
          key={b.id}
          onClick={() => navigate(`/board/detail/${b.id}`)} // 클릭 시 상세 페이지 이동
          sx={{
            bgcolor: b.pinned
              ? "primary.main" // 상단 고정글 → 파란색
              : b.noticeYn
              ? "#d9d9d9" // 공지글 → 회색
              : "white", // 일반글 → 흰색
            border: "1px solid #e0e0e0",
            borderRadius: 1,
            mb: 1.2,
            py: 1.2,
            width: "80%",
            mx: "auto", // 가운데 정렬
            flexDirection: "column", // 세로 배치
            alignItems: "flex-start",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)", // 그림자 효과
            transition: "background-color 0.2s ease",
            "&:hover": {
              bgcolor: b.pinned
                ? "primary.light" // 상단고정 hover → 밝은 파랑
                : b.noticeYn
                ? "#e0e0e0" // 공지 hover → 연회색
                : "#fafafa", // 일반 hover → 살짝 회색
            },
          }}
        >
          {/* 카테고리명 + 댓글 수 표시 */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary">
              {b.categoryName || "전체 게시판"}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <CommentIcon sx={{ fontSize: 15, color: "#616161" }} /> {/* 댓글 아이콘 */}
              <Typography variant="caption" color="text.secondary">
                {b.replyCount ?? 0}
              </Typography>
            </Stack>
          </Stack>

          {/* 제목 영역 (고정글/비공개 아이콘 포함) */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ width: "100%" }}>
            {b.pinned && (
              <img
                src={coreconnectLogo}
                alt="pinned"
                style={{ width: 26, height: 26 }}
              /> // 상단 고정글 로고
            )}
            {b.privateYn && (
              <LockIcon sx={{ fontSize: 18, color: "#9e9e9e" }} /> // 비공개 아이콘
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

          {/* 게시글 내용 미리보기 (1줄만 표시) */}
          {b.content && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
                mb: 0.5,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 1, // 한 줄로 제한
                WebkitBoxOrient: "vertical",
              }}
            >
              {b.content}
            </Typography>
          )}

          {/* 작성자, 작성일, 조회수 표시 */}
          <Typography variant="caption" color="text.secondary">
            {b.writerName} / {formatDate(b.createdAt)} / 조회수 {b.viewCount ?? 0}
          </Typography>
        </ListItemButton>
      ))}

      {/* 페이지네이션 */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Pagination
          count={Math.max(pageInfo.totalPages, 1)} // 최소 1페이지 유지
          page={currentPage + 1} // 현재 페이지 (0-index 보정)
          onChange={handlePageChange} // 페이지 이동 처리
        />
      </Box>
    </Box>
  );
};

export default BoardListPage;
