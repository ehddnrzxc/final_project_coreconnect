import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBoard } from "../../api/boardAPI";
import { uploadFiles } from "../../api/boardFileAPI";
import {
  Box,
  Button,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

const BoardWritePage = () => {
  const [form, setForm] = useState({
    title: "",
    content: "",
    categoryId: "",
    noticeYn: false,
    privateYn: false,
    pinned: false,
  });
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async () => {
    try {
      const res = await createBoard(form);
      const boardId = res.data.data.id;
      if (files.length > 0) await uploadFiles(boardId, files);
      alert("게시글 등록 완료!");
      navigate(`/board/detail/${boardId}`);
    } catch (err) {
      console.error("게시글 등록 실패:", err.response?.data || err.message);
      alert("게시글 등록 실패");
    }
  };

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        새 게시글 작성
      </Typography>
      <TextField
        label="카테고리 ID"
        name="categoryId"
        fullWidth
        sx={{ mb: 2 }}
        value={form.categoryId}
        onChange={handleChange}
      />
      <TextField
        label="제목"
        name="title"
        fullWidth
        sx={{ mb: 2 }}
        value={form.title}
        onChange={handleChange}
      />
      <TextField
        label="내용"
        name="content"
        multiline
        rows={8}
        fullWidth
        sx={{ mb: 2 }}
        value={form.content}
        onChange={handleChange}
      />
      <FormControlLabel
        control={<Checkbox name="noticeYn" checked={form.noticeYn} onChange={handleChange} />}
        label="공지글"
      />
      <FormControlLabel
        control={<Checkbox name="privateYn" checked={form.privateYn} onChange={handleChange} />}
        label="비공개"
      />
      <FormControlLabel
        control={<Checkbox name="pinned" checked={form.pinned} onChange={handleChange} />}
        label="상단 고정"
      />
      <input
        type="file"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files))}
        style={{ marginTop: "1rem" }}
      />
      <Button variant="contained" sx={{ mt: 3 }} onClick={handleSubmit}>
        등록
      </Button>
    </Box>
  );
};

export default BoardWritePage;
