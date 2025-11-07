import React, { useEffect, useState } from "react"; // React 훅: 상태관리, 생명주기 제어
import { useParams, useNavigate, useSearchParams } from "react-router-dom"; // 라우터 훅: 파라미터, 페이지 이동
import { createBoard, getBoardDetail, updateBoard } from "../api/boardAPI"; // 게시글 관련 API
import { uploadFiles } from "../api/boardFileAPI"; // 첨부파일 업로드 API
import { getAllCategories } from "../api/boardCategoryAPI"; // 카테고리 조회 API
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
} from "@mui/material"; // MUI: 입력, 선택, 버튼, 레이아웃 관련 컴포넌트
import LockIcon from "@mui/icons-material/Lock"; // 비공개 아이콘
import { handleApiError } from "../../../utils/handleError"; // 공통 에러 처리 함수

// 게시글 작성 및 수정 페이지 컴포넌트
const BoardWritePage = () => {
  const { boardId } = useParams(); // URL 파라미터에서 게시글 ID 추출
  const [searchParams] = useSearchParams(); // 수정1: 쿼리스트링 접근용
  const navigate = useNavigate(); // 페이지 이동 훅

  // 폼 상태 (제목, 내용, 옵션 등)
  const [form, setForm] = useState({
    title: "",
    content: "",
    categoryId: "",
    categoryName: "",
    noticeYn: false,
    privateYn: false,
    pinned: false,
  });

  // 카테고리 목록, 파일 상태
  const [categories, setCategories] = useState([]);
  const [files, setFiles] = useState([]);

  // 새 글 작성 시: 카테고리 목록 불러오기
  useEffect(() => {
    if (!boardId) {
      (async () => {
        try {
          const res = await getAllCategories();
          const list = res.data.data || [];
          setCategories(list);

          // 수정1: URL에 categoryId 있으면 기본값으로 세팅
          const defaultCat = searchParams.get("categoryId"); 
          if (defaultCat) { 
            setForm((f) => ({ ...f, categoryId: defaultCat }));
          } 
        } catch (err) {
          handleApiError(err, "카테고리 불러오기 실패");
        }
      })();
    }
  }, [boardId, searchParams]); 
  // 수정 모드일 경우: 기존 게시글 불러오기
  useEffect(() => {
    if (boardId) {
      (async () => {
        try {
          const res = await getBoardDetail(boardId); // 게시글 상세 조회
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
          handleApiError(err, "게시글 불러오기 실패");
        }
      })();
    }
  }, [boardId]);

  // 입력 변경 핸들러 (텍스트, 체크박스 공통)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // 상단 고정 체크 시 자동으로 공지 ON, 비공개 OFF
    if (name === "pinned" && checked) {
      setForm((f) => ({ ...f, pinned: true, noticeYn: true, privateYn: false }));
      return;
    }
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value, // 입력 타입별 값 처리
    }));
  };

  // 등록/수정 처리
  const handleSubmit = async () => {
    if (!boardId && !form.categoryId) {
      alert("카테고리를 선택해주세요.");
      return;
    }

    try {
      if (boardId) {
        // 수정 모드
        await updateBoard(boardId, form);
        alert("게시글이 수정되었습니다!");
        navigate(`/board/detail/${boardId}`);
      } else {
        // 등록 모드
        const res = await createBoard(form);
        const newId = res.data.data.id;
        if (files.length > 0) await uploadFiles(newId, files); // 첨부파일 업로드
        alert("게시글 등록 완료");
        navigate(`/board/${form.categoryId}`); // 카테고리 목록으로 이동
      }
    } catch (err) {
      handleApiError(err, "게시글 등록/수정 실패");
    }
  };

  return (
    <Box sx={{ maxWidth: 800 }}>
      {/* 페이지 제목 */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        {boardId ? "게시글 수정" : "새 게시글 작성"}
      </Typography>

      {/* 신규 작성일 경우 → 카테고리 선택 */}
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
        // 수정일 경우 카테고리명만 표시
        <Typography variant="body1" sx={{ mb: 2 }}>
          📂 카테고리: <b>{form.categoryName || "알 수 없음"}</b>
        </Typography>
      )}

      {/* 제목 입력 */}
      <TextField
        label="제목"
        name="title"
        fullWidth
        sx={{ mb: 2 }}
        value={form.title}
        onChange={handleChange}
      />

      {/* 내용 입력 */}
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

      {/* 옵션 영역: 공지, 비공개, 상단고정 */}
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
                  privateYn: checked ? false : f.privateYn, // 공지 ON → 비공개 해제
                  pinned: checked ? f.pinned : false,       // 공지 OFF → 상단고정 해제
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
                  noticeYn: checked ? false : f.noticeYn, // 비공개 ON → 공지 해제
                  pinned: checked ? false : f.pinned,     // 비공개 ON → 상단고정 해제
                }));
              }}
              disabled={form.noticeYn} // 공지글일 경우 비활성화
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
                  noticeYn: checked ? true : false,  // 상단고정 해제 시 공지도 해제
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

      {/* 비공개 선택 시 안내문 */}
      {form.privateYn && (
        <Box sx={{ display: "flex", alignItems: "center", mb: 1, color: "#616161" }}>
          <LockIcon sx={{ mr: 1 }} /> 비공개 게시글 — 작성자와 관리자만 볼 수 있습니다.
        </Box>
      )}

      {/* 첨부파일 업로드 */}
      <input
        type="file"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files))} // 파일 목록 상태에 저장
        style={{ marginTop: "1rem" }}
      />

      {/* 등록/수정 버튼 */}
      <Button variant="contained" sx={{ mt: 3 }} onClick={handleSubmit}>
        {boardId ? "수정 완료" : "등록"}
      </Button>
    </Box>
  );
};

export default BoardWritePage;
