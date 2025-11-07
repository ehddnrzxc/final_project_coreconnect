import React, { useEffect, useRef } from "react"; // React 훅: useEffect(생명주기), useRef(요소 참조)
import {
  Box,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material"; // MUI: 레이아웃 및 리스트 구성요소
import { Outlet, useNavigate, useLocation, useParams } from "react-router-dom";
import { getAllCategories } from "../api/boardCategoryAPI"; // 카테고리 API

// 게시판 전체 레이아웃 컴포넌트
const BoardLayout = () => {
  const [categories, setCategories] = React.useState([]); // 카테고리 목록 상태
  const navigate = useNavigate(); // 페이지 이동용 훅
  const location = useLocation(); // 현재 URL 위치 추적 훅
  const { categoryId } = useParams(); // 현재 URL 파라미터(카테고리 ID)
  const contentRef = useRef(null); // 스크롤 컨테이너 참조용 ref

  // 로컬 스토리지에서 사용자 정보 가져오기
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "ADMIN"; // 관리자 여부 확인

  // ────────────────────────────────
  // 현재 카테고리 상태 추적용 (수정1)
  // 리스트 외 페이지에서도 음영 유지용
  // ────────────────────────────────
  const [activeCategoryId, setActiveCategoryId] = React.useState(categoryId || ""); // 수정1

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

  // ────────────────────────────────
  // 경로 변경 시 카테고리 ID 동기화 (수정1)
  // /board/:categoryId → categoryId 추출
  // /board/detail/:id, /board/new → 최근 선택 카테고리 유지
  // ────────────────────────────────
  useEffect(() => {
    const path = location.pathname;

    // 1️⃣ 리스트 화면일 경우: 카테고리ID 직접 반영
    if (categoryId) {
      setActiveCategoryId(categoryId);
      localStorage.setItem("lastCategoryId", categoryId); // 수정1: 최근 카테고리 기억
    }

    // 2️⃣ 상세 또는 글쓰기일 경우: 최근 선택된 카테고리 복원
    else if (path.includes("/board/detail") || path.includes("/board/new")) {
      const savedId = localStorage.getItem("lastCategoryId");
      if (savedId) setActiveCategoryId(savedId); // 수정1
    }

    // 3️⃣ 전체 게시판은 초기화
    else {
      setActiveCategoryId("");
    }
  }, [location, categoryId]); // 수정1

  // ────────────────────────────────
  // 글쓰기 버튼 클릭 시 현재 카테고리 유지 이동 (수정1)
  // ────────────────────────────────
  const handleWriteClick = () => { // 수정1
    if (categoryId) navigate(`/board/new?categoryId=${categoryId}`); // 수정1
    else navigate(`/board/new`); // 수정1
  }; // 수정1

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
          onClick={handleWriteClick} // 글쓰기 페이지 이동
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
          {/* 전체 게시판 버튼 */}
          <ListItemButton
            onClick={() => navigate("/board?page=0")}
            sx={{
              bgcolor: "primary.main", // ★ 선택 전/후 관계없이 상단고정글 색 (#08a7bf)
              borderBottom: "1px solid #b0bec5", // 약간 더 진한 구분선
              borderRadius: 1.5, // 모서리 부드럽게
              boxShadow:
                "inset 0 1px 3px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.2)", // ★ 입체감 유지
              "&:hover": {
                bgcolor: "#079bb1", // hover 시 살짝 어두운 파랑
                boxShadow: "0 3px 6px rgba(0,0,0,0.1)", // hover 시 외곽 그림자 강화
                transition: "background-color 0.2s ease, box-shadow 0.2s ease",
              },
              fontWeight: 700, // 항상 굵은 글씨
              color: "#ffffff", // 항상 흰 글씨
              transition: "background-color 0.2s ease, box-shadow 0.2s ease", // 부드러운 색 전환
            }}
          >
            <ListItemText
              primary="전체 게시판"
              primaryTypographyProps={{
                fontWeight: 700,
                fontSize: "0.95rem", // 글씨 약간 키움
              }}
            />
          </ListItemButton>

          {/* 개별 카테고리 목록 */}
          {categories.map((cat, idx) => {
            const isActive = String(cat.id) === String(activeCategoryId); // 현재 선택된 카테고리 판별  // 수정1
            return (
              <ListItemButton
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)} // 해당 카테고리 페이지 이동
                sx={{
                  borderBottom:
                    idx === categories.length - 1
                      ? "none"
                      : "1px solid #e0e0e0",
                  bgcolor: isActive ? "#d9d9d9" : "transparent", // 선택된 카테고리 = 공지글 색상 // 수정1
                  "&:hover": {
                    bgcolor: "#d9d9d9", // hover 시 동일 색상 유지
                    boxShadow: "0 3px 6px rgba(0,0,0,0.1)", // hover 시 외곽 그림자 효과
                    transition: "background-color 0.2s ease, box-shadow 0.2s ease",
                  },
                  fontWeight: isActive ? 600 : 400, // 선택 시 굵게
                  color: isActive ? "#000000" : "inherit", // 선택 시 글씨색 유지
                  borderRadius: 1, // 모서리 살짝 둥글게
                  boxShadow: isActive
                    ? "inset 0 1px 3px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)" // 공지글 스타일 입체감 // 수정1
                    : "none",
                  transition: "background-color 0.2s ease, box-shadow 0.2s ease", // 부드러운 전환
                }}
              >
                <ListItemText primary={cat.name} />
              </ListItemButton>
            );
          })}

        </List>
      </Box>

      {/* 우측: 게시글 콘텐츠 영역 */}
      <Box
        component="main"
        ref={contentRef} // 스크롤 제어용 ref 연결
        sx={{
          flex: 1,
          p: 3,
          overflowY: "auto",
          bgcolor: "background.default",
        }}
      >
        <Outlet /> {/* 중첩 라우트 표시 (게시글 목록, 상세 등) */}
      </Box>
    </Box>
  );
};

export default BoardLayout;
