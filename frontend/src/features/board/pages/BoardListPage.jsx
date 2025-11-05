import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBoardsByCategory, searchBoards } from "../api/boardAPI";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Pagination,
  TextField,
  Select,
  MenuItem,
  Button,
} from "@mui/material";

const BoardListPage = () => {
  const { categoryId } = useParams();
  const [boards, setBoards] = useState([]);
  const [pageInfo, setPageInfo] = useState({ number: 0, totalPages: 1 });
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("title");
  const navigate = useNavigate();

  useEffect(() => {
    if (!categoryId) return;
    loadBoards();
  }, [categoryId, pageInfo.number]);

  const loadBoards = async () => {
    try {
      const res = await getBoardsByCategory(categoryId, pageInfo.number);
      setBoards(res.data.data.content);
      setPageInfo(res.data.data);
    } catch (err) {
      console.error("게시글 목록 불러오기 실패:", err.response?.data || err.message);
    }
  };

  const handleSearch = async () => {
    try {
      const res = await searchBoards(type, keyword, pageInfo.number);
      setBoards(res.data.data.content);
      setPageInfo(res.data.data);
    } catch (err) {
      console.error("검색 실패:", err.response?.data || err.message);
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>게시글 목록</Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Select size="small" value={type} onChange={(e) => setType(e.target.value)}>
          <MenuItem value="title">제목</MenuItem>
          <MenuItem value="content">내용</MenuItem>
          <MenuItem value="author">작성자</MenuItem>
        </Select>
        <TextField
          size="small"
          placeholder="검색어 입력"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Button variant="outlined" onClick={handleSearch}>검색</Button>
      </Box>

      <List>
        {boards.map((b) => (
          <ListItemButton key={b.id} onClick={() => navigate(`/board/detail/${b.id}`)}>
            <ListItemText
              primary={
                <>
                  {b.pinned && "📌 "}
                  {b.noticeYn && "[공지] "}
                  {b.title}
                </>
              }
              secondary={`${b.writerName} | ${new Date(b.createdAt).toLocaleString()} | 조회수 ${b.viewCount}`}
            />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Pagination
          count={pageInfo.totalPages}
          page={pageInfo.number + 1}
          onChange={(e, v) => setPageInfo((p) => ({ ...p, number: v - 1 }))}
        />
      </Box>
    </Box>
  );
};

export default BoardListPage;
