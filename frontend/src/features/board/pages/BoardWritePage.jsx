import { useEffect, useState } from "react";
import { Box, Button, TextField, Typography, Checkbox, FormControlLabel, Select, MenuItem, InputLabel,
  FormControl, Modal, Card, CardMedia, CardContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import DescriptionIcon from "@mui/icons-material/Description";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { createBoard, getBoardDetail, updateBoard } from "../api/boardAPI";
import { uploadFiles, getFilesByBoard, deleteFilesBulk } from "../api/boardFileAPI"; // 서버 업로드 API
import { getAllCategories } from "../api/boardCategoryAPI";
import { downloadZipFiles } from "../api/boardFileAPI"; // ZIP 다운로드 API
import { useSnackbarContext } from "../../../components/utils/SnackbarContext";


const BoardWritePage = () => {
  const { boardId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSnack } = useSnackbarContext();
  const [form, setForm] = useState({
    title: "",
    content: "",
    categoryId: "",
    noticeYn: false,
    privateYn: false,
    pinned: false,
  });
  const [categories, setCategories] = useState([]);

  //  파일 관련 상태 
  const [files, setFiles] = useState([]);
  const [deletedExistingFiles, setDeletedExistingFiles] = useState([]);  // 기존 파일 삭제목록
  const [previewFile, setPreviewFile] = useState(null);  // 모달용
  const [openModal, setOpenModal] = useState(false);     // 모달 열기/닫기


  // 파일 확장자 체크 → 이미지인지 비이미지인지 구분용
  const isImage = (name) => {
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(name);
  };

  // 신규 작성 시 카테고리 조회
  useEffect(() => {
    if (!boardId) {
      (async () => {
        try {
          const res = await getAllCategories();
          const list = res.data.data || [];
          setCategories(list);

          const defaultCat = searchParams.get("categoryId");
          if (defaultCat) {
            setForm((f) => ({ ...f, categoryId: defaultCat }));
          }
        } catch {
          showSnack("카테고리를 불러오지 못했습니다.", "error");
        }
      })();
    }
  }, [boardId]);

  // 수정 모드 → 기존 정보 불러오기
  useEffect(() => {
    if (!boardId) return;

    (async () => {
      try {
        // 게시글 정보
        const res = await getBoardDetail(boardId);
        const data = res.data.data;

        setForm({
          title: data.title,
          content: data.content,
          categoryId: data.categoryId,
          noticeYn: data.noticeYn,
          privateYn: data.privateYn,
          pinned: data.pinned,
        });

        // 기존 파일 목록 조회 추가
        const fileRes = await getFilesByBoard(boardId);
        const rawFiles = fileRes.data.data || [];

        // 기존 파일은 백엔드 DTO 구조(fileName, fileSize, fileUrl 등)를
        // 프론트에서 사용하는 통합 구조(name, size, url, type 등)로 변환
        const existingFiles = rawFiles.map((f) => ({
          ...f, // 필요시 다른 필드도 같이 보존
          type: "existing", // 기존 파일 표시용 플래그
          name: f.fileName, // 렌더링에서 공통으로 사용할 필드
          size: f.fileSize,
          url: f.fileUrl, // presigned URL
        }));

        setFiles(existingFiles); // 변환된 구조로 세팅

      } catch (err) {
        showSnack("게시글 정보를 불러오지 못했습니다.", "error");
      }
    })();
  }, [boardId]);

  // 입력 핸들러
  const handleChange = (e) => {
    const { name, checked, value, type } = e.target;

    // 상단 고정 선택 시 → 공지 자동 ON / 비공개 자동 OFF
    if (name === "pinned") {
      if (checked) {
        setForm((f) => ({
          ...f,
          pinned: true,
          noticeYn: true,   // 공지 자동 활성화
          privateYn: false, // 비공개 불가
        }));
      } else {
        setForm((f) => ({ ...f, pinned: false }));
      }
      return;
    }

    // 공지글 선택 시 → 비공개 자동 OFF
    if (name === "noticeYn") {
      if (checked) {
        setForm((f) => ({
          ...f,
          noticeYn: true,
          privateYn: false, // 비공개 불가
        }));
      } else {
        setForm((f) => ({ ...f, noticeYn: false }));
      }
      return;
    }

    // 비공개 선택 시 → 공지/상단고정 자동 OFF
    if (name === "privateYn") {
      if (checked) {
        setForm((f) => ({
          ...f,
          privateYn: true,
          noticeYn: false, // 공지 OFF
          pinned: false,   // 상단고정 OFF
        }));
      } else {
        setForm((f) => ({ ...f, privateYn: false }));
      }
      return;
    }

    // 기본 필드 처리
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 파일 선택 (append 방식)
  const handleFileSelect = (e) => {
    const newFiles = Array.from(e.target.files).filter(f => !!f);;

    // 기존 파일 유지 + 새 파일 append
    // → 새 파일도 기존과 동일한 구조(type/new, name, size, file)로 맞춰줌
    const wrapped = newFiles.map((file) => ({
      type: "new", // 신규 파일 표시
      file, // 실제 File 객체 보관
      name: file.name,
      size: file.size,
    }));

    setFiles((prev) => [...prev, ...wrapped]);
  };

  // 개별 파일 취소
  const removeFile = (idx) => {
    setFiles((prev) => {
      const target = prev[idx];

      // 기존 파일 삭제 → 목록 추가
      if (target.type === "existing") {
        setDeletedExistingFiles((list) => [...list, target.id]);
      }

      return prev.filter((_, i) => i !== idx);
    });
  };

  // 전체 ZIP 다운로드
  const handleDownloadAll = async () => {
    if (files.length < 2) return;

    try {
      await downloadZipFiles(files);
      showSnack("ZIP 파일 다운로드 시작!", "info");
    } catch {
      showSnack("ZIP 다운로드 실패", "error");
    }
  };

  // 등록/수정 처리
  const handleSubmit = async () => {
    if (!boardId && !form.categoryId) {
      showSnack("카테고리를 선택해주세요.", "error");
      return;
    }

    try {
      // 수정 모드
      if (boardId) {
        await updateBoard(boardId, form); // 게시글 기본 정보 업데이트

        // 수정 시 삭제된 기존 파일들 처리
        if (deletedExistingFiles.length > 0) {
          await deleteFilesBulk(deletedExistingFiles);
        }

        const uploadList = files // 새로 추가된 파일만 업로드
          .filter((f) => f.type === "new" && f.file) // 기존 파일 제외
          .map((f) => f.file); // File 객체만 추출

        if (uploadList.length > 0) {
          await uploadFiles(boardId, uploadList);
        }

        showSnack("수정 완료!", "success");
        navigate(`/board/detail/${boardId}`);
        return;
      }

      // 신규 작성 모드
      const res = await createBoard(form);
      const newId = res.data.data.id;

      // 새 파일만 추출해서 업로드
      const uploadList = files
        .filter((f) => f.type === "new")
        .map((f) => f.file);

      if (uploadList.length > 0) await uploadFiles(newId, uploadList);

      showSnack("등록 되었습니다.", "success");
      navigate(`/board/${form.categoryId}`);

    } catch {
      showSnack("저장 중 오류 발생", "error");
    }
  };

  // 모달 열기
  const openPreview = (file) => {
    setPreviewFile(file);   // file 객체 그대로 저장 (type/new,existing 포함)
    setOpenModal(true);
  };

  // 모달 닫기
  const closePreview = () => {
    setOpenModal(false);
    setPreviewFile(null);
  };

  // UI 렌더링
  return (
    <Box sx={{ px: "5%", pt: 2, maxWidth: 1000 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {boardId ? "게시글 수정" : "새 게시글 작성"}
      </Typography>

      {/* --- 카테고리 선택 --- */}
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
        <Typography sx={{ mb: 2 }}>
          📂 <b>{form.categoryName}</b>
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

      {/* 옵션 + 등록 버튼 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", gap: 2 }}>
          {/* 공지글 */}
          <FormControlLabel
            control={
              <Checkbox
                name="noticeYn"
                checked={form.noticeYn}
                onChange={handleChange}
                disabled={form.privateYn} // 비공개 시 비활성화
              />
            }
            label={
              <Typography
                sx={{
                  color: form.noticeYn ? "primary.main" : "text.secondary", // 색 강조
                  fontWeight: form.noticeYn ? "bold" : "normal",
                }}
              >
                공지글
              </Typography>
            }
          />

          {/* 비공개 */}
          <FormControlLabel
            control={
              <Checkbox
                name="privateYn"
                checked={form.privateYn}
                onChange={handleChange}
                disabled={form.noticeYn || form.pinned} // 공지/상단고정 시 비활성화
              />
            }
            label={
              <Typography
                sx={{
                  color: form.privateYn ? "error.main" : "text.secondary", // 색 강조
                  fontWeight: form.privateYn ? "bold" : "normal",
                }}
              >
                비공개
              </Typography>
            }
          />

          {/* 상단 고정 */}
          <FormControlLabel
            control={
              <Checkbox
                name="pinned"
                checked={form.pinned}
                onChange={handleChange}
                disabled={form.privateYn} // 비공개 시 상단고정 불가
              />
            }
            label={
              <Typography
                sx={{
                  color: form.pinned ? "primary.dark" : "text.secondary", // 색 강조
                  fontWeight: form.pinned ? "bold" : "normal",
                }}
              >
                상단 고정
              </Typography>
            }
          />
        </Box>

        <Button variant="contained" onClick={handleSubmit}>
          {boardId ? "수정 완료" : "등록"}
        </Button>
      </Box>

      {/* 파일 선택 버튼 + 개수 표시 */}
      <Button variant="outlined" component="label">
        파일 선택
        <input type="file" multiple hidden onChange={handleFileSelect} />
      </Button>

      <Typography sx={{ ml: 2, display: "inline-block" }}>
        ({files.length}개)
      </Typography>

      {/* 파일 카드 */}
      <Box
        sx={{
          mt: 3,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        {files.map((file, idx) => (
          <Card
            key={idx}
            sx={{
              width: 150,
              height: 160,
              borderRadius: 2,
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              position: "relative",
              cursor: "pointer",
            }}
          >
            {/* 취소 버튼 */}
            <IconButton
              size="small"
              sx={{
                position: "absolute",
                top: 5,
                right: 5,
                bgcolor: "#fff",
              }}
              onClick={(e) => {
                e.stopPropagation();
                removeFile(idx);
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>

            {/* 썸네일 */}
            {isImage(file.name) ? (
              <CardMedia
                component="img"
                height="100"
                image={
                  file.type === "existing"
                    ? file.url // 기존 파일 → presigned URL
                    : URL.createObjectURL(file.file) // 신규 파일 → File 객체
                }
                onClick={() => openPreview(file)}
              />
            ) : (
              <Box
                sx={{
                  height: 120,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "#f5f5f5",
                }}
                onClick={() => openPreview(file)}
              >
                <DescriptionIcon sx={{ fontSize: 80, color: "#9e9e9e" }} />
              </Box>
            )}

            {/* 파일명 */}
            <CardContent sx={{ p: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                {file.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {(file.size / 1024).toFixed(1)} KB
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* 미리보기 모달 */}
      <Modal open={openModal} onClose={closePreview}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "white",
            p: 3,
            borderRadius: 2,
            width: 400,
            textAlign: "center",
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            파일 미리보기
          </Typography>

          {/* 이미지 */}
          {previewFile && isImage(previewFile.name) ? (
            <img
              src={
                previewFile.type === "existing"
                  ? previewFile.url // 기존 파일
                  : URL.createObjectURL(previewFile.file) // 신규 파일
              }
              alt="preview"
              style={{
                width: "100%",
                maxHeight: 300,
                objectFit: "contain",
                borderRadius: 8,
              }}
            />
          ) : (
            <DescriptionIcon sx={{ fontSize: 80, color: "#777" }} />
          )}

          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => {
                if (!previewFile) return; // 안전 체크

                const link = document.createElement("a");

                if (previewFile.type === "existing") {
                  link.href = previewFile.url; // 기존 파일은 URL 직접 다운로드
                } else {
                  link.href = URL.createObjectURL(previewFile.file); // 신규 파일은 File 객체로부터 URL 생성
                }

                link.download = previewFile.name;
                link.click();
              }}
            >
              다운로드
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default BoardWritePage;
