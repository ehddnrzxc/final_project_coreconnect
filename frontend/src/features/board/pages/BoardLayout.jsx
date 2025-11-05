import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";
import { getAllCategories, createCategory } from "../api/boardCategoryAPI";

const BoardLayout = () => {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false); // 카테고리 추가 모달
  const [newCategory, setNewCategory] = useState({ name: "", orderNo: "" });
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
        const sorted = [...data].sort((a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0));
        setCategories(sorted);
      } catch (err) {
        console.error("카테고리 로드 실패:", err.response?.data || err.message);
      }
    })();
  }, []);

  const handleCategoryClick = (id) => navigate(`/board/${id}`);

  const handleAddCategory = async () => {
    try {
      await createCategory({
        name: newCategory.name,
        orderNo: Number(newCategory.orderNo),
      });
      alert("카테고리 등록 완료!");
      setOpen(false);
      setNewCategory({ name: "", orderNo: "" });

      // 등록 후 다시 정렬된 목록으로 갱신
      const res = await getAllCategories();
      const sorted = [...(res.data.data || [])].sort((a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0));
      setCategories(sorted);
    } catch (err) {
      alert("카테고리 등록 실패");
      console.error(err.response?.data || err.message);
    }
  };

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

        {/* 관리자 전용 버튼들 */}
        {isAdmin && (
          <>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              sx={{ mb: 1 }}
              onClick={() => setOpen(true)}
            >
              카테고리 추가
            </Button>

            {/* 카테고리 관리 페이지로 이동 */}
            <Button
              variant="outlined"
              color="info"
              fullWidth
              sx={{ mb: 2 }}
              onClick={() => navigate("/admin/board/category")}
            >
              카테고리 관리
            </Button>
          </>
        )}

        <List>
          {/* 전체 게시판 버튼 */}
          <ListItemButton onClick={() => navigate("/board")}>
            <ListItemText primary="전체 게시판" />
          </ListItemButton>

          {/* 카테고리 목록 표시 */}
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

      {/* 관리자 전용 카테고리 추가 모달 */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>새 카테고리 추가</DialogTitle>
        <DialogContent>
          <TextField
            label="카테고리명"
            fullWidth
            sx={{ mt: 1 }}
            value={newCategory.name}
            onChange={(e) =>
              setNewCategory((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <TextField
            label="순서 번호"
            type="number"
            fullWidth
            sx={{ mt: 2 }}
            value={newCategory.orderNo}
            onChange={(e) =>
              setNewCategory((prev) => ({ ...prev, orderNo: e.target.value }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>취소</Button>
          <Button onClick={handleAddCategory} variant="contained">
            등록
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BoardLayout;