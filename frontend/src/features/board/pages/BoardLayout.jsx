import React, { useEffect, useRef } from "react"; // React 훅: useEffect(생명주기), useRef(요소 참조)
import {
  Box,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material"; // MUI: 레이아웃 및 리스트 구성요소
import { Outlet, useNavigate, useLocation } from "react-router-dom"; // React Router: 중첩 라우트, 페이지 이동, 위치 추적
import { getAllCategories } from "../api/boardCategoryAPI"; // 카테고리 API

// 게시판 전체 레이아웃 컴포넌트
const BoardLayout = () => {
  const [categories, setCategories] = React.useState([]); // 카테고리 목록 상태
  const navigate = useNavigate(); // 페이지 이동용 훅
  const location = useLocation(); // 현재 URL 위치 추적 훅
  const contentRef = useRef(null); // 스크롤 컨테이너 참조용 ref

  // 로컬 스토리지에서 사용자 정보 가져오기
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "ADMIN"; // 관리자 여부 확인

  // 전체 카테고리 불러오기
  useEffect(() => {
    (async () => {
      try {
        const res = await getAllCategories(); // API 요청
        const data = res.data.data || [];
        // orderNo 기준 오름차순 정렬
        const sorted = [...data].sort(
          (a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0)
        );
        setCategories(sorted); // 상태 업데이트
      } catch (err) {
        console.error("카테고리 로드 실패:", err.response?.data || err.message);
      }
    })();
  }, []);

  // 카테고리 클릭 시 해당 게시판으로 이동
  const handleCategoryClick = (id) => navigate(`/board/${id}`);

  // 라우트 변경 시 스크롤을 맨 위로 이동
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location]); // location이 바뀔 때마다 실행

  return (
    <Box sx={{ display: "flex", height: "100%" }}>
      {/* 좌측 카테고리 영역 */}
      <Box
        sx={{
          width: 240,
          borderRight: 1,
          borderColor: "divider",
          p: 2,
          bgcolor: "#fff",
        }}
      >
        {/* 게시판 제목 */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          게시판
        </Typography>

        {/* 글쓰기 버튼 */}
        <Button
          variant="contained"
          fullWidth
          sx={{ mb: 1 }}
          onClick={() => navigate("/board/new")} // 글쓰기 페이지 이동
        >
          글쓰기
        </Button>

        {/* 관리자만 카테고리 관리 버튼 표시 */}
        {isAdmin && (
          <Button
            variant="outlined"
            color="info"
            fullWidth
            sx={{ mb: 2 }}
            onClick={() => navigate("/admin/board/category")} // 관리자 페이지 이동
          >
            카테고리 관리
          </Button>
        )}

        {/* 카테고리 목록 리스트 */}
        <List>
          {/* 전체 게시판 버튼 (공지 배경 색상과 동일) */}
          <ListItemButton
            onClick={() => navigate("/board?page=0")} // 전체 게시글 보기
            sx={{
              bgcolor: "#d9d9d9", // 회색 배경
              borderBottom: "1px solid #e0e0e0", // 구분선
              "&:hover": { bgcolor: "#cfcfcf" }, // hover 시 진해짐
            }}
          >
            <ListItemText
              primary="전체 게시판"
              primaryTypographyProps={{ fontWeight: 600 }} // 글자 약간 굵게
            />
          </ListItemButton>

          {/* 개별 카테고리 목록 */}
          {categories.map((cat, idx) => (
            <ListItemButton
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)} // 해당 카테고리 페이지 이동
              sx={{
                borderBottom:
                  idx === categories.length - 1
                    ? "none"
                    : "1px solid #e0e0e0", // 마지막 항목 제외 구분선
                "&:hover": { bgcolor: "#f9f9f9" }, // hover 시 연회색 배경
              }}
            >
              <ListItemText primary={cat.name} /> {/* 카테고리 이름 표시 */}
            </ListItemButton>
          ))}
        </List>
      </Box>

      {/* 우측: 게시글 콘텐츠 영역 */}
      <Box
        component="main"
        ref={contentRef} // 스크롤 제어용 ref 연결
        sx={{
          flex: 1, // 남은 공간 전체 차지
          p: 3,
          overflowY: "auto", // 세로 스크롤 가능
          bgcolor: "background.default", // 배경색 시스템 기본값
        }}
      >
        <Outlet /> {/* 중첩 라우트 표시 (게시글 목록, 상세 등) */}
      </Box>
    </Box>
  );
};

export default BoardLayout;
