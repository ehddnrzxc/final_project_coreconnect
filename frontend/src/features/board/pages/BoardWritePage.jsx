import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createBoard, getBoardDetail, updateBoard } from "../api/boardAPI";
import { uploadFiles } from "../api/boardFileAPI";
import { getAllCategories } from "../api/boardCategoryAPI";
import {
  Box,
  Button,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock"; // 자물쇠 아이콘 추가

const BoardWritePage = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    content: "",
    categoryId: "",
    categoryName: "",
    noticeYn: false,
    privateYn: false,
    pinned: false,
  });
  const [categories, setCategories] = useState([]);
  const [files, setFiles] = useState([]);

  // 카테고리 목록 불러오기 (신규 작성 시만)
  useEffect(() => {
    if (!boardId) {
      (async () => {
        try {
          const res = await getAllCategories();
          setCategories(res.data.data || []);
        } catch (err) {
          console.error("카테고리 목록 불러오기 실패:", err);
        }
      })();
    }
  }, [boardId]);

  // 수정 모드일 경우 기존 데이터 불러오기
  useEffect(() => {
    if (boardId) {
      (async () => {
        try {
          const res = await getBoardDetail(boardId);
          const data = res.data.data;
          setForm({
            id: data.id,
            title: data.title,
            content: data.content,
            categoryId: data.categoryId || "",
            categoryName: data.categoryName || "",
            noticeYn: data.noticeYn ?? false,
            privateYn: data.privateYn ?? false,
            pinned: data.pinned ?? false,
          });
        } catch (err) {
          console.error("게시글 불러오기 실패:", err);
        }
      })();
    }
  }, [boardId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // 상단고정 시 자동 공지처리
    if (name === "pinned" && checked) {
      setForm((f) => ({ ...f, pinned: true, noticeYn: true, privateYn: false }));
      return;
    }

    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    if (!boardId && !form.categoryId) {
      alert("카테고리를 선택해주세요.");
      return;
    }

    try {
      if (boardId) {
        await updateBoard(boardId, form);
        alert("게시글이 수정되었습니다!");
        navigate(`/board/detail/${boardId}`); 
      } else {
        const res = await createBoard(form);
        const newId = res.data.data.id;
        if (files.length > 0) await uploadFiles(newId, files);
        alert("게시글 등록 완료!");
        navigate(`/board/${form.categoryId}`); 
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

      {/* 작성 시: 카테고리 선택 / 수정 시: 표시 */}
      {!boardId ? (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>카테고리 선택</InputLabel>
          <Select
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            label="카테고리 선택"
          >
            <MenuItem value="">선택</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <Typography variant="body1" sx={{ mb: 2 }}>
          📂 카테고리: <b>{form.categoryName || "알 수 없음"}</b>
        </Typography>
      )}

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

      {/* 체크박스 영역 */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        {/* 공지글 */}
        <FormControlLabel
          control={
            <Checkbox
              name="noticeYn"
              checked={form.noticeYn}
              onChange={(e) => {
                const checked = e.target.checked;
                setForm((f) => ({
                  ...f,
                  noticeYn: checked,
                  privateYn: checked ? false : f.privateYn,
                }));
              }}
              disabled={form.privateYn} // 비공개일 땐 비활성화
              sx={{
                color: form.noticeYn ? "#9E9E9E" : "inherit",
                "&.Mui-checked": { color: "#9E9E9E" },
              }}
            />
          }
          label="공지글"
        />

        {/* 비공개 */}
        <FormControlLabel
          control={
            <Checkbox
              name="privateYn"
              checked={form.privateYn}
              onChange={(e) => {
                const checked = e.target.checked;
                setForm((f) => ({
                  ...f,
                  privateYn: checked,
                  noticeYn: checked ? false : f.noticeYn, // 공지 해제
                  pinned: checked ? false : f.pinned,     // 상단고정 해제
                }));
              }}
            />
          }
          label="비공개"
        />

        {/* 상단 고정 */}
        <FormControlLabel
          control={
            <Checkbox
              name="pinned"
              checked={form.pinned}
              onChange={(e) => {
                const checked = e.target.checked;
                setForm((f) => ({
                  ...f,
                  pinned: checked,
                  noticeYn: checked ? true : f.noticeYn,
                  privateYn: checked ? false : f.privateYn,
                }));
              }}
              disabled={form.privateYn} // 비공개일 땐 비활성화
              sx={{
                color: form.pinned ? "#FFA726" : "inherit",
                "&.Mui-checked": { color: "#FFA726" },
              }}
            />
          }
          label="상단 고정"
        />
      </Box>

      {/* 비공개 아이콘 표시 */}
      {form.privateYn && (
        <Box sx={{ display: "flex", alignItems: "center", mb: 1, color: "#616161" }}>
          <LockIcon sx={{ mr: 1 }} /> 비공개 게시글 — 작성자와 관리자만 볼 수 있습니다.
        </Box>
      )}

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
