import { useEffect, useState } from "react";
// React 훅
// useEffect → 컴포넌트 생명주기 제어 (렌더링 이후 데이터 로드 등)
// useState → 상태 관리 (데이터를 저장하고 변경 시 리렌더링)
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
// React Router 훅
// useParams → URL의 동적 파라미터 추출 (예: /board/:categoryId)
// useNavigate → 페이지 이동 (navigate("/path"))
// useSearchParams → URL 쿼리스트링 (예: ?page=1&sortType=latest) 제어
import { Box, Typography, ListItemButton, Pagination, Stack, TextField, Button, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
// MUI(Material UI) 컴포넌트 임포트
// Box: 레이아웃 컨테이너 (div 역할)
// Typography: 텍스트 표현용
// ListItemButton: 클릭 가능한 리스트 항목
// Pagination: 페이지네이션 UI
// Stack: 수평 또는 수직 정렬 컨테이너 (flexbox 래퍼)
// TextField: 입력 필드
// Button: 버튼
// MenuItem, Select, FormControl, InputLabel: 선택 드롭다운 UI 구성 요소
import { getBoardsByCategory, getBoardsOrdered, searchBoards } from "../api/boardAPI";
// 게시판 관련 API 모듈 임포트
// getBoardsByCategory → 특정 카테고리의 게시글 목록 요청
// getBoardsOrdered → 전체 게시글 목록 (정렬 기준 포함)
// searchBoards → 검색 조건에 따른 게시글 조회
import CommentIcon from "@mui/icons-material/Comment"; // 댓글 개수 표시용 아이콘
import RecentViewedBoards from "./RecentViewedBoards"; // 오른쪽 사이드 영역에서 "최근 본 게시글"을 렌더링하는 컴포넌트
import { useSnackbarContext } from "../../../components/utils/SnackbarContext"; // 전역 스낵바 컨텍스트
import AttachFileIcon from "@mui/icons-material/AttachFile";  // 첨부파일 아이콘 추가


// ──────────────────────────────────────────────
// BoardListPage 컴포넌트
// - 게시판 목록 페이지 전체를 담당하는 컴포넌트
// - 정렬, 검색, 페이지네이션, 목록 렌더링, 최근 본 게시글 등을 모두 포함
// ──────────────────────────────────────────────
const BoardListPage = () => {
  const { categoryId } = useParams(); // URL의 /board/:categoryId 값 추출 (없으면 undefined)
  const [searchParams] = useSearchParams(); // URL 쿼리스트링 (?page=, ?sortType= 등) 제어용
  const navigate = useNavigate(); // 페이지 이동 훅 (ex. navigate("/board/new"))
  const { showSnack } = useSnackbarContext(); // 스낵바 훅 사용
  const currentPage = Number(searchParams.get("page")) || 0; // 현재 페이지 번호 (기본 0)
  const urlType = searchParams.get("type") || ""; // 검색 유형 (title, content, author 등)
  const urlKeyword = (searchParams.get("keyword") || "").trim(); // 검색 키워드
  const urlSortType = searchParams.get("sortType") || "latest"; // 정렬 기준 (기본값: 최신순)
  const isSearchPage = urlType && urlKeyword !== ""; // 검색 페이지 여부 판단
  const [boards, setBoards] = useState([]); // 게시글 목록 배열
  const [pageInfo, setPageInfo] = useState({ number: 0, totalPages: 1 }); // 페이지 정보 객체
  const [searchType, setSearchType] = useState(urlType || "title"); // 검색 구분 (제목/내용/작성자)
  const [keyword, setKeyword] = useState(urlKeyword || ""); // 검색어 입력값
  const [sortType, setSortType] = useState(urlSortType); // 정렬 상태 (최신순/조회순)

  // URL 변경 시 검색 폼 상태를 동기화
  useEffect(() => {
    setSearchType(urlType || "title");  // URL 쿼리(type)과 동기화
    setKeyword(urlKeyword || "");       // URL 쿼리(keyword)와 동기화
  }, [urlType, urlKeyword]);            // 의존성 추가

  // ─────────────── 게시글 목록 불러오기 ───────────────
  useEffect(() => {
    (async () => {
      try {
        let res; // API 응답 결과 저장용 변수
        if (isSearchPage) { // 검색 페이지인 경우
          res = await searchBoards(urlType, urlKeyword, currentPage);
        } else { // 일반 목록 페이지인 경우
          if (categoryId) { // 카테고리별 게시판
            res = await getBoardsByCategory(categoryId, sortType, currentPage);
          } else { // 전체 게시판 (정렬 기준 적용)
            res = await getBoardsOrdered(sortType, currentPage);
          }
        }

        // 응답에서 content(게시글 목록)과 페이징 데이터 추출
        setBoards(res.data.data.content);
        setPageInfo(res.data.data);
      } catch (err) {
        showSnack("게시글 목록을 불러오는 중 오류가 발생했습니다.", "error");
      }
    })();
  }, [categoryId, currentPage, isSearchPage, urlType, urlKeyword, sortType]); // 의존성 배열: 이 중 하나라도 바뀌면 다시 실행

  // ─────────────── 날짜 포맷 함수 ───────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr); // 'MM-DD HH:mm' 형식으로 변환
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  };

  // ─────────────── 페이지 이동 함수 ───────────────
  const handlePageChange = (e, v) => {
    const newPage = v - 1; // MUI는 1부터 시작하지만 API는 0부터 시작하므로 보정
    const queryBase = categoryId ? `/board/${categoryId}` : "/board";
    const sortQuery = `sortType=${sortType}`;

    if (isSearchPage) { // 검색 중인 경우: 검색 상태 유지한 채 페이지 이동
      navigate(
        `/board/search?type=${urlType}&keyword=${encodeURIComponent(
          urlKeyword
        )}&page=${newPage}`
      );
      return;
    }

    navigate(`${queryBase}?${sortQuery}&page=${newPage}`); // 일반 목록: 정렬 기준과 페이지 정보 포함 이동
  };

  // ─────────────── 검색 기능 ───────────────
  const handleSearch = () => {
    const trimmed = keyword.trim(); // 공백 제거
    if (!trimmed) { // 검색어 없을 시 → 기본 목록으로 이동
      if (categoryId)
        navigate(`/board/${categoryId}?sortType=${sortType}&page=0`);
      else navigate(`/board?sortType=${sortType}&page=0`);
      return;
    }

    // 검색어 있을 경우: type, keyword, page 포함해 이동
    navigate(
      `/board/search?type=${searchType}&keyword=${encodeURIComponent(
        trimmed
      )}&page=0`
    );
  };

  const handleKeyPress = (e) => { // Enter 키로 검색 실행
    if (e.key === "Enter") handleSearch();
  };

  // ─────────────── 정렬 변경 기능 ───────────────
  const handleSortChange = (e) => {
    const newSort = e.target.value; // 선택된 정렬값 (latest/views)
    setSortType(newSort); // 상태 업데이트
    // 정렬 변경 시 페이지를 0으로 초기화하여 다시 요청
    if (categoryId)
      navigate(`/board/${categoryId}?sortType=${newSort}&page=0`);
    else navigate(`/board?sortType=${newSort}&page=0`);
  };

  // ──────────────────────────────────────────────
  // UI 렌더링
  // ──────────────────────────────────────────────
  return (
    <Box sx={{ display: "flex", gap: 3 }}>
      {/* Box: 최상위 레이아웃 컨테이너 */}
      {/* display="flex" → 내부를 좌우 배치 (왼쪽: 목록 / 오른쪽: 최근 본 글) */}
      {/* gap=3 → 좌우 영역 간 간격 확보 */}

      <Box sx={{ flex: 3 }}>
        {/* 왼쪽 메인 게시글 목록 영역 */}
        {/* flex=3 → 전체 가로 공간 중 약 3비율 차지 */}

        {/* 상단 정렬 및 검색 영역 */}
        <Stack
          direction="row"
          spacing={2}
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2, px: "10%" }}
        >
          {/* Stack: MUI의 수평 정렬 컨테이너 */}
          {/* direction="row" → 내부 요소들을 가로로 나열 */}
          {/* spacing=2 → 각 요소 간 기본 여백 */}
          {/* justifyContent="space-between" → 좌측 정렬, 우측 검색 영역 구분 */}
          {/* alignItems="center" → 세로 중앙 정렬 */}
          {/* sx.mb=2 → Stack 아래 여백 2단위 */}
          {/* px="10%" → 양쪽 여백을 10%로 두어 가운데 배치 효과 */}

          {/* 정렬 선택박스 */}
          <FormControl size="small" sx={{ width: 130 }}>
            {/* FormControl: Select, InputLabel을 감싸는 컨테이너 */}
            {/* size="small" → 컴팩트한 높이로 */}
            {/* width=130px 고정 */}

            <InputLabel id="sort-label">정렬</InputLabel>
            {/* InputLabel: Select의 제목 역할 */}

            <Select
              labelId="sort-label"
              value={sortType}
              label="정렬"
              onChange={handleSortChange}
            >
              {/* Select: 드롭다운 메뉴 */}
              {/* value와 onChange로 상태 관리 */}
              <MenuItem value="latest">최신순</MenuItem>
              <MenuItem value="views">조회순</MenuItem>
            </Select>
          </FormControl>

          {/* 검색 영역 */}
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Stack: 검색 옵션 + 입력창 + 버튼을 수평 배치 */}

            <FormControl size="small" sx={{ width: 100 }}>
              <InputLabel>검색구분</InputLabel>
              <Select
                value={searchType}
                label="검색구분"
                onChange={(e) => setSearchType(e.target.value)}
              >
                {/* 검색 조건 선택 */}
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
            {/* TextField: 검색어 입력창
                size="small" → 컴팩트 크기
                placeholder → 회색 안내 문구
                onKeyDown → 엔터로 검색 실행 */}

            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
              sx={{ minWidth: 70 }}
            >
              검색
            </Button>
            {/* Button: 검색 실행 버튼
                variant="contained" → 채워진 스타일
                color="primary" → 메인 색상 */}
          </Stack>
        </Stack>

        {/* 게시글 목록 영역 */}
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
            {/* ListItemButton: 클릭 가능한 게시글 항목
                pinned → 파란색 배경 (공지)
                noticeYn → 회색 배경 (공지글)
                나머지 → 흰색 배경 */}

            {/* 상단: 카테고리명 + 댓글 수 + 첨부파일 수 */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" color="text.secondary">
                {b.categoryName || "전체 게시판"}
              </Typography>

              {/* 댓글 개수 */}
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <CommentIcon sx={{ fontSize: 15, color: "#616161" }} />
                <Typography variant="caption" color="text.secondary">
                  {b.replyCount ?? 0}
                </Typography>

                {/* 첨부파일 아이콘 + 파일 개수 */}
                {b.files && b.files.length > 0 && (
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.3}
                    sx={{ ml: 1 }}
                  >
                    <AttachFileIcon sx={{ fontSize: 15, color: "#616161" }} />
                    <Typography variant="caption" color="text.secondary">
                      {b.files.length}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Stack>

            {/* 제목 행 */}
            < Stack direction="row" alignItems="center" spacing={1} sx={{ width: "100%" }}>
              {b.pinned && (  // 상단고정
                <Typography
                  component="span"
                  sx={{ fontSize: 20, mr: 0.5 }}
                >
                  📌
                </Typography>
              )}
              {b.privateYn && (  // 비공개
                <Typography
                  component="span"
                  sx={{ fontSize: 19, mr: 0.5 }}
                >
                  🔒
                </Typography>
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

            {/* 내용 미리보기 (한 줄만 표시) */}
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

            {/* 하단: 작성자, 작성일, 조회수 */}
            <Typography variant="caption" color="text.secondary">
              {b.writerName} / {formatDate(b.createdAt)} / 조회수{" "}
              {b.viewCount ?? 0}
            </Typography>
          </ListItemButton>
        ))
        }

        {/* 페이지네이션 영역 */}
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          {/* Pagination을 가운데 정렬 */}
          <Pagination
            count={Math.max(pageInfo.totalPages, 1)} // 전체 페이지 수
            page={currentPage + 1} // 현재 페이지 (API는 0부터, MUI는 1부터)
            onChange={handlePageChange} // 페이지 변경 이벤트
          />
        </Box>
      </Box >

      {/* 오른쪽 사이드 영역: 최근 본 게시글 */}
      < Box sx={{ flex: 1.1 }}>
        <RecentViewedBoards />
      </Box >
    </Box >
  );
};

export default BoardListPage; // BoardListPage 컴포넌트를 외부에서 import 가능하게 내보냄
