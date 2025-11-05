import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";
import { getAllCategories } from "../api/boardCategoryAPI";

const BoardLayout = () => {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  // 현재 로그인 유저 정보
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "ADMIN";

  // 카테고리 목록 로드 (orderNo 순서로 정렬)
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

  return (
    <Box sx={{ display: "flex", height: "100%" }}>
      {/* 좌측: 카테고리 목록 */}
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

        {/* 글쓰기 버튼 */}
        <Button
          variant="contained"
          fullWidth
          sx={{ mb: 1 }}
          onClick={() => navigate("/board/new")}
        >
          글쓰기
        </Button>

        {/* 관리자 전용: 카테고리 관리 */}
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

        {/* 전체 게시판 + 카테고리 목록 */}
        <List>
          <ListItemButton onClick={() => navigate("/board")}>
            <ListItemText primary="전체 게시판" />
          </ListItemButton>

          {categories.map((cat) => (
            <ListItemButton
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
            >
              <ListItemText primary={cat.name} />
            </ListItemButton>
          ))}
        </List>
      </Box>

      {/* 우측: 게시판 콘텐츠 */}
      <Box
        component="main"
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
