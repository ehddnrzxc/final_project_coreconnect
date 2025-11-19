import { useEffect, useState } from "react";
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, IconButton, TextField, Button } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import { getAllCategories, createCategory, updateCategory, deleteCategory } from "../api/boardCategoryAPI";
import { useSnackbarContext } from "../../../components/utils/SnackbarContext";
import ConfirmDialog from "../../../components/utils/ConfirmDialog";


const AdminCategoryPage = () => {
  const { showSnack } = useSnackbarContext(); // 스낵바 훅 사용

  // 상태 관리
  const [categories, setCategories] = useState([]); // 전체 카테고리 목록을 저장하는 상태
  const [editingId, setEditingId] = useState(null); // 현재 수정 중인 카테고리의 id (수정 모드 판별용)
  const [editedData, setEditedData] = useState({ name: "", orderNo: "" }); // 수정 중 입력값 저장
  const [newCategory, setNewCategory] = useState({ name: "", orderNo: "" }); // 신규 등록용 입력값 저장
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const confirmMessage = "이 카테고리를 삭제하시겠습니까?";

  // 전체 카테고리 불러오기 (비동기 함수)
  const loadCategories = async () => {
    try {
      const res = await getAllCategories(); // 백엔드 API로 전체 카테고리 목록 요청
      // 받아온 목록을 orderNo(정렬순서) 기준으로 오름차순 정렬
      const sorted = [...(res.data.data || [])].sort(
        (a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0)
      );
      setCategories(sorted); // 정렬된 목록을 상태에 반영
    } catch (err) {
      showSnack("카테고리 목록을 불러오는 중 오류가 발생했습니다.", "error");
    }
  };

  // 컴포넌트 최초 마운트 시 전체 카테고리 목록 불러오기
  useEffect(() => {
    loadCategories(); // 페이지 로딩 시 1회 실행
  }, []);

  // 수정 버튼 클릭 시 동작
  const handleEdit = (cat) => {
    setEditingId(cat.id); // 수정 모드로 전환 (해당 행만 수정 가능)
    setEditedData({ name: cat.name, orderNo: cat.orderNo }); // 기존 데이터 입력창에 채워넣기
  };

  // 저장 버튼 클릭 시 동작 → 수정 내용 백엔드 반영
  const handleSave = async (id) => {
    try {
      await updateCategory(id, editedData); // 수정 API 요청
      showSnack("카테고리가 수정되었습니다.", "success");
      setEditingId(null); // 수정 모드 종료
      loadCategories(); // 목록 새로 불러오기
    } catch (err) {
      showSnack("카테고리 수정 중 오류가 발생했습니다.", "error");
    }
  };

  // 삭제 버튼 클릭 시 → 확인창 오픈
  const handleOpenDeleteConfirm = (id) => {
    setTargetId(id);
    setConfirmOpen(true);
  };

  // 확인창에서 "확인" 클릭 시
  const handleConfirm = async () => {
    setConfirmOpen(false);
    if (targetId) {
      await handleDelete(targetId);
    }
    setTargetId(null);
  };

  // 확인창에서 "취소"
  const handleCancel = () => {
    setConfirmOpen(false);
    setTargetId(null);
  };

  // 삭제 버튼 클릭 시 동작
  const handleDelete = async (id) => {
    showSnack("카테고리를 삭제 중입니다...", "info"); // 사용자 확인창 표시
    try {
      await deleteCategory(id); // 삭제 API 요청
      showSnack("카테고리가 삭제되었습니다.", "success");
      loadCategories(); // 목록 새로 불러오기
    } catch (err) {
      showSnack("카테고리 삭제 중 오류가 발생했습니다.", "error"); // 에러 발생 시 처리
    }
  };

  // 등록 버튼 클릭 시 동작 → 신규 카테고리 생성
  const handleCreate = async () => {
    if (!newCategory.name.trim()) {
      showSnack("카테고리명을 입력해주세요.", "error");
      return;
    }
    try {
      await createCategory(newCategory); // 등록 API 요청
      showSnack("새 카테고리가 등록되었습니다.", "success");
      setNewCategory({ name: "", orderNo: "" }); // 입력창 초기화
      loadCategories(); // 목록 새로고침
    } catch (err) {
      showSnack("카테고리 등록 중 오류가 발생했습니다.", "error");
    }
  };

  // JSX 렌더링
  return (
    <Box sx={{ p: 3, width: "80%", mx: "auto" }}>
      {/* 페이지 제목 영역 */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        카테고리 관리 (관리자 전용)
      </Typography>

      {/* 신규 카테고리 등록 영역 */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        {/* 카테고리명 입력 필드 */}
        <TextField
          label="카테고리명"
          size="small"
          value={newCategory.name}
          onChange={(e) =>
            setNewCategory((prev) => ({ ...prev, name: e.target.value }))
          } // 입력값 변경 시 상태 갱신
        />
        {/* 순서번호 입력 필드 */}
        <TextField
          label="순서번호"
          size="small"
          type="number"
          inputProps={{ min: 0 }} // 0 이상만 입력 허용
          value={newCategory.orderNo}
          onChange={(e) =>
            setNewCategory((prev) => ({ ...prev, orderNo: e.target.value }))
          } // 입력값 변경 시 상태 갱신
        />
        {/* 등록 버튼 */}
        <Button
          variant="contained"
          startIcon={<AddIcon />} // 추가 아이콘 표시
          onClick={handleCreate} // 클릭 시 등록 실행
        >
          등록
        </Button>
      </Box>

      {/* 카테고리 목록 테이블 */}
      <Table>
        <TableHead>
          <TableRow>
            {/* 테이블 헤더: 열 이름 */}
            <TableCell>카테고리명</TableCell>
            <TableCell>순서번호</TableCell>
            <TableCell align="center">수정/삭제</TableCell> {/* 수정/삭제 버튼 구역 */}
          </TableRow>
        </TableHead>
        <TableBody>
          {/* 카테고리 리스트 반복 렌더링 */}
          {categories.map((cat) => (
            <TableRow key={cat.id}>
              <TableCell>
                {/* 수정 중이면 입력창, 아니면 텍스트 표시 */}
                {editingId === cat.id ? (
                  <TextField
                    size="small"
                    value={editedData.name}
                    onChange={(e) =>
                      setEditedData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                ) : (
                  cat.name
                )}
              </TableCell>

              <TableCell>
                {/* 수정 중이면 입력창, 아니면 숫자 표시 */}
                {editingId === cat.id ? (
                  <TextField
                    size="small"
                    type="number"
                    inputProps={{ min: 0 }}
                    value={editedData.orderNo}
                    onChange={(e) =>
                      setEditedData((prev) => ({
                        ...prev,
                        orderNo: e.target.value,
                      }))
                    }
                  />
                ) : (
                  cat.orderNo
                )}
              </TableCell>

              {/* 액션 버튼 (수정 / 저장 / 삭제) */}
              <TableCell align="center">
                {editingId === cat.id ? (
                  // 수정 모드일 때는 저장 버튼 표시
                  <IconButton color="primary" onClick={() => handleSave(cat.id)}>
                    <SaveIcon />
                  </IconButton>
                ) : (
                  // 일반 모드일 때는 수정 버튼 표시
                  <IconButton color="secondary" onClick={() => handleEdit(cat)}>
                    <EditIcon />
                  </IconButton>
                )}
                {/* 삭제 → 확인창 오픈 */}
                <IconButton
                  color="error"
                  onClick={() => handleOpenDeleteConfirm(cat.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 삭제 확인창 */}
      <ConfirmDialog
        open={confirmOpen}
        title="삭제 확인"
        message={confirmMessage}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </Box>
  );
};

export default AdminCategoryPage;
