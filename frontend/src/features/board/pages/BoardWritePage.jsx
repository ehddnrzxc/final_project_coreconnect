import { useEffect, useState } from "react"; 
// React 훅 불러오기
// useEffect: 컴포넌트 생명주기 제어
// useState: 상태 관리
import { useParams, useNavigate, useSearchParams } from "react-router-dom"; 
// React Router 훅 불러오기
// useParams: URL 파라미터 추출
// useNavigate: 페이지 이동용 함수
// useSearchParams: 쿼리스트링 읽기/수정
import { createBoard, getBoardDetail, updateBoard } from "../api/boardAPI"; 
// 게시글 API
// createBoard: 게시글 등록
// getBoardDetail: 게시글 상세 조회
// updateBoard: 게시글 수정
import { uploadFiles } from "../api/boardFileAPI"; 
// 파일 업로드 API
import { getAllCategories } from "../api/boardCategoryAPI"; 
// 카테고리 조회 API
import { Box, Button, TextField, Typography, Checkbox, FormControlLabel, Select, MenuItem, InputLabel, FormControl } from "@mui/material"; 
// MUI UI 컴포넌트
// Box: 레이아웃
// Button: 버튼
// TextField: 입력창
// Typography: 텍스트
// Checkbox: 체크박스
// FormControlLabel: 체크박스/라벨 묶음
// Select/MenuItem/InputLabel/FormControl: 드롭다운 구성 요소
import LockIcon from "@mui/icons-material/Lock"; // MUI 아이콘: 비공개 상태 자물쇠 표시
import { useSnackbarContext } from "../../../components/utils/SnackbarContext"; // 전역 스낵바 컨텍스트 추가


// 게시글 작성 및 수정 페이지를 담당하는 컴포넌트
const BoardWritePage = () => {
  const { boardId } = useParams(); // URL 경로에서 게시글 ID 추출 (예: /board/write/:boardId 형태)
  const [searchParams] = useSearchParams(); // URL 쿼리스트링 접근용 훅 (예: ?categoryId=3)
  const navigate = useNavigate(); // 페이지 이동 기능 제공 훅
  const { showSnack } = useSnackbarContext();

  // 게시글 작성 폼에 사용되는 상태 변수 (제목, 내용, 옵션 등)
  const [form, setForm] = useState({
    title: "",           // 게시글 제목
    content: "",         // 게시글 내용
    categoryId: "",      // 선택된 카테고리 ID
    categoryName: "",    // 카테고리 이름 (수정 시 표시용)
    noticeYn: false,     // 공지 여부
    privateYn: false,    // 비공개 여부
    pinned: false,       // 상단 고정 여부
  });

  // 카테고리 목록과 파일 업로드 관련 상태
  const [categories, setCategories] = useState([]); // 전체 카테고리 리스트
  const [files, setFiles] = useState([]);           // 첨부파일 리스트

  // 게시글 작성 모드일 때 실행: 카테고리 목록 불러오기
  useEffect(() => {
    if (!boardId) { // boardId가 없으면 새 글 작성 모드
      (async () => {
        try {
          const res = await getAllCategories(); // 전체 카테고리 목록 API 요청
          const list = res.data.data || []; // 응답 데이터에서 카테고리 리스트 추출
          setCategories(list); // 상태에 저장

          // URL에 categoryId 쿼리스트링이 있으면 해당 값으로 기본 카테고리 선택
          const defaultCat = searchParams.get("categoryId");
          if (defaultCat) {
            setForm((f) => ({ ...f, categoryId: defaultCat }));
          }
        } catch (err) {
          showSnack("카테고리 목록을 불러오는 중 오류가 발생했습니다.", "error");
        }
      })();
    }
  }, [boardId, searchParams]); // boardId나 쿼리스트링이 변경될 때 재실행

  // 수정 모드일 때 실행: 기존 게시글 데이터 불러오기
  useEffect(() => {
    if (boardId) { // boardId가 있으면 수정 모드
      (async () => {
        try {
          const res = await getBoardDetail(boardId); // 게시글 상세 조회 API 호출
          const data = res.data.data; // 응답 데이터 추출
          // 기존 게시글 내용을 form 상태에 세팅
          setForm({
            id: data.id,
            title: data.title,
            content: data.content,
            categoryId: data.categoryId || "",
            categoryName: data.categoryName || "",
            noticeYn: data.noticeYn ?? false, // null 병합 연산자: null이면 false
            privateYn: data.privateYn ?? false,
            pinned: data.pinned ?? false,
          });
        } catch (err) {
          showSnack("게시글 정보를 불러오지 못했습니다.", "error");
        }
      })();
    }
  }, [boardId]);

  // 입력값 변경 핸들러 (텍스트/체크박스 모두 대응)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target; // 이벤트 객체에서 입력 이름, 값, 타입, 체크 여부 추출

    // 상단고정을 체크할 경우: 자동으로 공지 ON, 비공개 OFF 설정
    if (name === "pinned" && checked) {
      setForm((f) => ({ ...f, pinned: true, noticeYn: true, privateYn: false }));
      return;
    }

    // 일반 입력값(텍스트/체크박스)에 대한 상태 업데이트
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value, // 체크박스면 checked, 아니면 value 사용
    }));
  };

  // 게시글 등록 또는 수정 처리 함수
  const handleSubmit = async () => {
    // 작성 모드에서 카테고리 선택 안 했을 경우
    if (!boardId && !form.categoryId) {
      showSnack("카테고리를 선택해주세요.", "warning");
      return;
    }

    try {
      if (boardId) {
        // 수정 모드: 기존 게시글 업데이트 API 호출
        await updateBoard(boardId, form);
        showSnack("게시글이 수정되었습니다.", "success");
        navigate(`/board/detail/${boardId}`); // 수정 후 상세 페이지로 이동
      } else {
        // 등록 모드: 새 게시글 등록
        const res = await createBoard(form);
        const newId = res.data.data.id; // 새로 생성된 게시글 ID 추출

        // 첨부파일이 존재하면 업로드 API 호출
        if (files.length > 0) await uploadFiles(newId, files);
        showSnack("게시글이 등록되었습니다.", "success");
        navigate(`/board/${form.categoryId}`); // 해당 카테고리 목록으로 이동
      }
    } catch (err) {
      showSnack("게시글 등록 또는 수정 중 오류가 발생했습니다.", "error");
    }
  };

  // 실제 렌더링 부분 (화면 표시 구성)
  return (
    <Box sx={{ px: "5%", pt: 2, maxWidth: 1000 }}>
      {/* 페이지 제목: 수정 모드냐 신규 작성이냐에 따라 텍스트 변경 */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        {boardId ? "게시글 수정" : "새 게시글 작성"}
      </Typography>

      {/* 신규 작성 시에만 카테고리 선택 가능 */}
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
        // 수정 모드일 경우 카테고리명만 표시 (수정 불가)
        <Typography variant="body1" sx={{ mb: 2 }}>
          📂 카테고리: <b>{form.categoryName || "알 수 없음"}</b>
        </Typography>
      )}

      {/* 제목 입력 필드 */}
      <TextField
        label="제목"
        name="title"
        fullWidth
        sx={{ mb: 2 }}
        value={form.title}
        onChange={handleChange}
      />

      {/* 내용 입력 필드 (여러 줄 입력 가능) */}
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

      {/* 공지글 / 비공개 / 상단고정 옵션 구역 */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        {/* 공지글 체크박스 */}
        <FormControlLabel
          control={
            <Checkbox
              name="noticeYn"
              checked={form.noticeYn}
              onChange={(e) => {
                const checked = e.target.checked;
                // 공지 ON 시 비공개 해제, OFF 시 상단고정 해제
                setForm((f) => ({
                  ...f,
                  noticeYn: checked,
                  privateYn: checked ? false : f.privateYn,
                  pinned: checked ? f.pinned : false,
                }));
              }}
              disabled={form.privateYn} // 비공개일 때는 공지 설정 불가
              sx={{
                color: form.noticeYn ? "#9E9E9E" : "inherit", // 회색 표시
                "&.Mui-checked": { color: "#9E9E9E" },
              }}
            />
          }
          label="공지글"
        />

        {/* 비공개 체크박스 */}
        <FormControlLabel
          control={
            <Checkbox
              name="privateYn"
              checked={form.privateYn}
              onChange={(e) => {
                const checked = e.target.checked;
                // 비공개 ON 시 공지 및 상단고정 해제
                setForm((f) => ({
                  ...f,
                  privateYn: checked,
                  noticeYn: checked ? false : f.noticeYn,
                  pinned: checked ? false : f.pinned,
                }));
              }}
              disabled={form.noticeYn} // 공지글이면 비공개 불가
            />
          }
          label="비공개"
        />

        {/* 상단고정 체크박스 */}
        <FormControlLabel
          control={
            <Checkbox
              name="pinned"
              checked={form.pinned}
              onChange={(e) => {
                const checked = e.target.checked;
                // 상단고정 ON 시 공지 자동 설정, 비공개 해제
                setForm((f) => ({
                  ...f,
                  pinned: checked,
                  noticeYn: checked ? true : false,
                  privateYn: checked ? false : f.privateYn,
                }));
              }}
              disabled={form.privateYn} // 비공개일 때는 상단고정 불가
              sx={{
                color: form.pinned ? "#FFA726" : "inherit", // 주황색 표시
                "&.Mui-checked": { color: "#FFA726" },
              }}
            />
          }
          label="상단 고정"
        />
      </Box>

      {/* 비공개일 때 안내문 표시 */}
      {form.privateYn && (
        <Box sx={{ display: "flex", alignItems: "center", mb: 1, color: "#616161" }}>
          <LockIcon sx={{ mr: 1 }} /> 비공개 게시글 — 작성자와 관리자만 볼 수 있습니다.
        </Box>
      )}

      {/* 첨부파일 입력창: 여러 개 업로드 가능 */}
      <input
        type="file"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files))} // 파일 목록을 배열로 변환해 상태에 저장
        style={{ marginTop: "1rem" }}
      />

      {/* 등록 또는 수정 버튼 */}
      <Button variant="contained" sx={{ mt: 3 }} onClick={handleSubmit}>
        {boardId ? "수정 완료" : "등록"}
      </Button>
    </Box>
  );
};

export default BoardWritePage;  // 컴포넌트 내보내기 (다른 페이지에서 import 가능)
