import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createBoard, getBoardDetail, updateBoard } from "../api/boardAPI";
import { uploadFiles } from "../api/boardFileAPI";
import { Box, Button, TextField, Typography, Checkbox, FormControlLabel } from "@mui/material";

const BoardWritePage = () => {
  const { boardId } = useParams(); // ✅ 추가
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

  // ✅ 수정 모드일 경우 기존 데이터 불러오기
  useEffect(() => {
    if (boardId) {
      (async () => {
        try {
          const res = await getBoardDetail(boardId);
          setForm(res.data.data);
        } catch (err) {
          console.error("게시글 불러오기 실패:", err);
        }
      })();
    }
  }, [boardId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async () => {
    try {
      if (boardId) {
        // ✅ 수정 모드
        await updateBoard(boardId, form);
        alert("게시글이 수정되었습니다!");
        navigate(`/board/detail/${boardId}`);
      } else {
        // ✅ 등록 모드
        const res = await createBoard(form);
        const newId = res.data.data.id;
        if (files.length > 0) await uploadFiles(newId, files);
        alert("게시글 등록 완료!");
        navigate(`/board/detail/${newId}`);
      }
    } catch (err) {
      console.error("게시글 등록/수정 실패:", err.response?.data || err.message);
      alert("게시글 등록/수정 실패");
    }
  };

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {boardId ? "게시글 수정" : "새 게시글 작성"}
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
        {boardId ? "수정 완료" : "등록"}
      </Button>
    </Box>
  );
};

export default BoardWritePage;