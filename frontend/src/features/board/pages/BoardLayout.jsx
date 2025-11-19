import React, { useEffect, useRef, useContext } from "react";
import { Box, Button, List, ListItemButton, ListItemText, Typography } from "@mui/material";
import { Outlet, useNavigate, useLocation, useParams } from "react-router-dom";
import { getAllCategories } from "../api/boardCategoryAPI";
import { useSnackbarContext } from "../../../components/utils/SnackbarContext";
import { UserProfileContext } from "../../../App";


const BoardLayout = () => {
  const [categories, setCategories] = React.useState([]);
  // 상태값: 게시판 카테고리 목록 배열
  // 서버에서 불러온 카테고리들을 저장하고, 좌측 리스트 렌더링에 사용
  const navigate = useNavigate();
  // 페이지 이동을 위한 훅
  // 예: navigate("/board"), navigate("/board/new")
  const location = useLocation();
  // 현재 URL 경로 정보를 가져오는 훅
  // 예: location.pathname → "/board/3", "/board/detail/10" 등
  const { categoryId } = useParams();
  // URL 파라미터에서 categoryId 추출 (예: /board/3 → categoryId="3")
  // /board, /board/detail/:id 같은 경로에서는 undefined일 수 있음
  const contentRef = useRef(null);
  // 스크롤을 제어하기 위해 오른쪽 콘텐츠 영역(Box)을 참조할 ref 객체
  // 현재는 window.scrollTo를 사용하고 있어 직접 사용되지는 않지만,
  // 필요시 contentRef.current.scrollTo(...) 방식으로 영역 내부 스크롤 제어 가능
  const { showSnack } = useSnackbarContext(); // 스낵바 표시 함수 (success, error 등 상태별 호출)
  const { userProfile } = useContext(UserProfileContext) || {};
  const isAdmin = userProfile?.role === "ADMIN";
  // 사용자 권한이 ADMIN인지 확인 → 관리자 여부 판별
  // ADMIN이면 카테고리 관리 버튼을 보여줌

  // 현재 활성화된 카테고리 ID 상태 관리
  // - 게시글 상세나 글쓰기 페이지로 이동해도, 좌측 카테고리 선택 상태(음영)를 유지하기 위해 별도 상태로 관리
  // - URL에 categoryId가 없을 수도 있어 초기값을 빈 문자열("")로 처리
  const [activeCategoryId, setActiveCategoryId] = React.useState( categoryId || "" );
  // activeCategoryId: 좌측 리스트에서 "어떤 카테고리가 선택되었는지" 표시하기 위한 값
  // categoryId가 있으면 그 값으로, 없으면 ""로 시작

  // 전체 카테고리 목록 불러오기
  // - 페이지 최초 로드 시 한 번만 실행됨 (의존성 배열 [])
  // - 서버에서 가져온 카테고리를 orderNo 기준으로 정렬 후 상태에 저장
  useEffect(() => {
    // 이 useEffect는 BoardLayout이 처음 화면에 나타날 때 한 번만 실행된다.
    // 카테고리 목록을 서버에서 불러오고, 정렬하여 좌측 메뉴로 보여주는 핵심 부분이다.
    (async () => {
      try {
        const res = await getAllCategories(); // 백엔드 API 호출 (삭제되지 않은 카테고리 목록 조회)
        const data = res.data.data || []; // 응답 데이터의 "data" 배열을 추출 (null/undefined 방어)

        // orderNo(카테고리 순서 번호) 기준 오름차순 정렬
        // orderNo가 null/undefined인 경우 0으로 취급하여 정렬
        const sorted = [...data].sort(
          (a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0)
        );

        setCategories(sorted); // 정렬된 카테고리 목록을 상태로 저장 → 좌측 리스트에서 사용
      } catch (err) {
        showSnack("카테고리 목록을 불러오지 못했습니다.", "error");
      }
    })();
  }, []); // 컴포넌트 마운트 시 1회 실행 (카테고리 목록은 자주 변하지 않으므로 한 번만 로드)

  // URL 경로(location)가 바뀔 때마다 카테고리 상태를 동기화
  // - /board/:categoryId 형태에서는 categoryId를 활성화
  // - /board/detail/:id 또는 /board/new일 경우 마지막 선택 카테고리를 복원
  // - /board 전체 게시판일 경우는 선택 해제
  useEffect(() => {
    const path = location.pathname;
    if (/^\/board\/\d+$/.test(path)) {
      // /board/:id → 카테고리 선택
      setActiveCategoryId(categoryId);
      localStorage.setItem("lastCategoryId", categoryId);
    }

    // /board → 전체 게시판 → 선택 제거
    else if (path === "/board") {
      setActiveCategoryId("");
    }

    // /board/new → 쿼리스트링 categoryId 있을 때만 유지
    else if (path === "/board/new") {
      const params = new URLSearchParams(location.search);
      const qCatId = params.get("categoryId");

      if (qCatId) {
        setActiveCategoryId(qCatId);
        localStorage.setItem("lastCategoryId", qCatId);
      } else {
        setActiveCategoryId("");
      }
    }

    // /board/detail/:id → 상세페이지 진입 시
    else if (path.includes("/board/detail")) {
      // 상세보기 들어오기 직전 URL이 "/board" 였다면 → 전체 게시판이므로 active 제거
      if (location.state?.fromAllBoard === true) {
        setActiveCategoryId(""); // 어떤 카테고리도 active되면 안 됨
        return;
      }

      // 그 외 → 카테고리에서 온 것이므로 마지막 카테고리 유지
      const savedId = localStorage.getItem("lastCategoryId");
      if (savedId) setActiveCategoryId(savedId);
    }
  }, [location, categoryId]);
  // location 또는 categoryId가 변경될 때마다 위 로직을 다시 실행
  // 경로가 바뀔 때마다 좌측 카테고리 상태를 최신 상태로 유지

  // 글쓰기 버튼 클릭 시 현재 카테고리 정보를 유지한 채 이동
  // - 카테고리 페이지에서 글쓰기 시, URL 쿼리로 categoryId를 함께 넘겨서
  //   글쓰기 폼에서 해당 카테고리를 기본 선택 상태로 사용할 수 있게 함
  const handleWriteClick = () => {
    if (categoryId) navigate(`/board/new?categoryId=${categoryId}`);
    // 현재 카테고리가 있을 때 → /board/new?categoryId=xx 형태로 이동
    else navigate(`/board/new`); // 전체 게시판일 경우 → 단순히 글쓰기 페이지로 이동
  };

  // 카테고리 클릭 시 해당 카테고리 게시판 페이지로 이동
  // 예: 카테고리 ID가 3이면 /board/3 으로 이동
  const handleCategoryClick = (id) => navigate(`/board/${id}`);

  // 라우트 변경 시 화면 스크롤을 맨 위로 이동시키는 효과
  // - 예: 상세보기 → 목록 이동 시 스크롤 위치 초기화
  // - window.scrollTo는 브라우저 전체 스크롤 기준으로 동작
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    // location(경로)이 바뀔 때마다 브라우저 뷰포트의 스크롤을 최상단으로 이동
    // behavior: "smooth" → 부드럽게 올라가는 애니메이션 효과
  }, [location]);
  // URL(location)이 바뀔 때마다 실행됨
  // 즉, 카테고리 변경 / 상세보기 / 글쓰기 등 모든 네비게이션에 대해 항상 맨 위로 올림

  // 실제 렌더링 부분
  // - 좌측: 카테고리 리스트 + 버튼들
  // - 우측: Outlet(게시판 페이지 콘텐츠)
  return (
    <Box sx={{ display: "flex", height: "100%" }}>
      {/* 최상위 레이아웃 컨테이너 */}
      {/* display="flex" → 좌우 2컬럼 구조 (왼쪽 카테고리 / 오른쪽 콘텐츠) */}
      {/* height="100%" → 부모 높이 전체를 차지 */}

      {/* 좌측 카테고리 영역 */}
      <Box
        sx={{
          width: 240, // 고정 폭 (240px)
          borderRight: 1, // 오른쪽에 구분선 두께 1 (theme.spacing 단위)
          borderColor: "divider", // 테마에서 정의된 divider 색상 사용
          p: 2, // 내부 여백 (padding) 2단위
          bgcolor: "#fff", // 배경색 흰색
        }}
      >
        {/* 게시판 제목 (좌측 상단 텍스트) */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          게시판
        </Typography>

        {/* 글쓰기 버튼 */}
        <Button
          variant="contained"
          fullWidth
          sx={{ mb: 1 }}
          onClick={handleWriteClick} // 클릭 시 글쓰기 페이지로 이동
        >
          글쓰기
        </Button>

        {/* 관리자 전용 카테고리 관리 버튼 (ADMIN 권한 사용자만 표시됨) */}
        {isAdmin && (
          <Button
            variant="outlined"
            color="info"
            fullWidth
            sx={{ mb: 2 }}
            onClick={() => navigate("/admin/board/category")} // 관리자용 카테고리 관리 페이지로 이동
          >
            카테고리 관리
          </Button>
        )}

        {/* 카테고리 목록 리스트 */}
        <List>
          {/* 전체 게시판 버튼 (모든 글 보기) */}
          <ListItemButton
            onClick={() => navigate("/board?page=0")} // 전체 게시판 페이지 이동 (page=0으로 초기화)
            sx={{
              bgcolor: "primary.main", // 항상 메인 색상 (#08a7bf)
              borderBottom: "1px solid #b0bec5", // 하단 구분선
              borderRadius: 1.5, // 살짝 둥근 모서리
              boxShadow:
                "inset 0 1px 3px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.2)", // 입체감 있는 그림자
              "&:hover": {
                bgcolor: "#079bb1", // hover 시 약간 어두운 파랑
                boxShadow: "0 3px 6px rgba(0,0,0,0.1)", // hover 시 외곽 그림자 강화
                transition: "background-color 0.2s ease, box-shadow 0.2s ease", // 부드러운 전환 효과
              },
              fontWeight: 700, // 굵은 글씨체
              color: "#ffffff", // 글씨 흰색
              transition: "background-color 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            <ListItemText
              primary="전체 게시판"
              primaryTypographyProps={{
                fontWeight: 700,
                fontSize: "0.95rem", // 글씨 크기 약간 키움
              }}
            />
          </ListItemButton>

          {/* 개별 카테고리 목록 출력 */}
          {categories.map((cat, idx) => {
            const isActive = String(cat.id) === String(activeCategoryId);
            // 현재 카테고리가 활성화 상태인지 비교 (문자열로 통일하여 비교)
            // activeCategoryId와 cat.id 타입이 다를 수 있으므로 String으로 변환해서 비교

            return (
              <ListItemButton
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)} // 클릭 시 해당 카테고리로 이동
                sx={{
                  borderBottom:
                    idx === categories.length - 1
                      ? "none" // 마지막 항목은 구분선 제거
                      : "1px solid #e0e0e0",
                  bgcolor: isActive ? "#d9d9d9" : "transparent", // 선택된 항목만 배경색 지정
                  "&:hover": {
                    bgcolor: "#d9d9d9", // hover 시 동일 색 유지
                    boxShadow: "0 3px 6px rgba(0,0,0,0.1)", // hover 시 그림자 효과
                    transition:
                      "background-color 0.2s ease, box-shadow 0.2s ease",
                  },
                  fontWeight: isActive ? 600 : 400, // 선택 시 굵게 표시
                  color: isActive ? "#000000" : "inherit", // 선택 시 글씨 색 유지
                  borderRadius: 1, // 둥근 모서리
                  boxShadow: isActive
                    ? "inset 0 1px 3px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)" // 활성화된 항목 입체감
                    : "none",
                  transition:
                    "background-color 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <ListItemText primary={cat.name} /> {/* 카테고리 이름 표시 */}
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      {/* 우측: 게시글 본문 영역 */}
      <Box
        component="main"
        ref={contentRef} // 스크롤 제어용 ref 연결 (필요시 내부 스크롤 제어 가능)
        sx={{
          flex: 1, // 남은 영역 전부 차지 (좌측 240px 제외한 나머지 공간)
          pt: 3, // 상단 여백
          overflowY: "auto", // 세로 스크롤 허용 → 내용이 길면 자체 스크롤
          bgcolor: "background.default", // 테마 기본 배경색
        }}
      >
        {/* Outlet: React Router 중첩 라우트가 렌더링되는 위치
            BoardListPage, BoardDetailPage, BoardWritePage 등이 이 안에 표시됨
            즉, BoardLayout은 레이아웃만 담당하고,
            실제 페이지 내용은 자식 라우트 컴포넌트가 채우는 구조 */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default BoardLayout; // BoardLayout 컴포넌트를 외부에서 사용할 수 있도록 export
