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
import { getAllCategories } from "../../api/boardCategoryAPI";

const BoardLayout = () => {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllCategories();
        setCategories(res.data.data || []);
      } catch (err) {
        console.error("카테고리 로드 실패:", err.response?.data || err.message);
      }
    })();
  }, []);

  const handleCategoryClick = (id) => navigate(`/board/${id}`);

  return (
    <Box sx={{ display: "flex", height: "100%" }}>
      <Box
        sx={{
          width: 240,
          borderRight: 1,
          borderColor: "divider",
          p: 2,
          bgcolor: "#fff",
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>게시판</Typography>
        <Button
          variant="contained"
          fullWidth
          sx={{ mb: 2 }}
          onClick={() => navigate("/board/new")}
        >
          글쓰기
        </Button>

        <List>
          {categories.map((cat) => (
            <ListItemButton key={cat.id} onClick={() => handleCategoryClick(cat.id)}>
              <ListItemText primary={cat.name} />
            </ListItemButton>
          ))}
        </List>
      </Box>

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
