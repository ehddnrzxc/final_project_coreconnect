import React, { useEffect, useRef } from "react";
import {
  Box,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { getAllCategories } from "../api/boardCategoryAPI";

const BoardLayout = () => {
  const [categories, setCategories] = React.useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef(null); // 스크롤 컨테이너 ref

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllCategories();
        const data = res.data.data || [];
        const sorted = [...data].sort(
          (a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0)
        );
        setCategories(sorted);
      } catch (err) {
        console.error("카테고리 로드 실패:", err.response?.data || err.message);
      }
    })();
  }, []);

  const handleCategoryClick = (id) => navigate(`/board/${id}`);

  // 라우트 변경될 때마다 스크롤을 맨 위로 올림
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location]);

  return (
    <Box sx={{ display: "flex", height: "100%" }}>
      {/* 좌측 카테고리 */}
      <Box
        sx={{
          width: 240,
          borderRight: 1,
          borderColor: "divider",
          p: 2,
          bgcolor: "#fff",
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          게시판
        </Typography>

        <Button
          variant="contained"
          fullWidth
          sx={{ mb: 1 }}
          onClick={() => navigate("/board/new")}
        >
          글쓰기
        </Button>

        {isAdmin && (
          <Button
            variant="outlined"
            color="info"
            fullWidth
            sx={{ mb: 2 }}
            onClick={() => navigate("/admin/board/category")}
          >
            카테고리 관리
          </Button>
        )}

        <List>
          {/* 전체 게시판 — 공지와 동일한 회색 배경 */}
          <ListItemButton
            onClick={() => navigate("/board?page=0")}
            sx={{
              bgcolor: "#d9d9d9", // ✅ 공지글과 동일한 회색
              borderBottom: "1px solid #e0e0e0", // ✅ 구분선
              "&:hover": { bgcolor: "#cfcfcf" }, // ✅ hover 시 약간 진한 회색
            }}
          >
            <ListItemText
              primary="전체 게시판"
              primaryTypographyProps={{ fontWeight: 600 }} // ✅ 약간 굵게
            />
          </ListItemButton>

          {/* 나머지 카테고리 목록 */}
          {categories.map((cat, idx) => (
            <ListItemButton
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              sx={{
                borderBottom:
                  idx === categories.length - 1
                    ? "none"
                    : "1px solid #e0e0e0", // ✅ 구분선
                "&:hover": { bgcolor: "#f9f9f9" }, // ✅ hover 효과
              }}
            >
              <ListItemText primary={cat.name} />
            </ListItemButton>
          ))}
        </List>
      </Box>

      {/* 우측: 콘텐츠 */}
      <Box
        component="main"
        ref={contentRef} // 스크롤 제어용 ref
        sx={{
          flex: 1,
          p: 3,
          overflowY: "auto",
          bgcolor: "background.default",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default BoardLayout;
