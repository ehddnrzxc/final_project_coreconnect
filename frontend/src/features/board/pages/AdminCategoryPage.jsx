import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  TextField,
  Button,
} from "@mui/material"; // MUI: UI 구성용 기본 컴포넌트들
import EditIcon from "@mui/icons-material/Edit"; // MUI: 수정 아이콘
import DeleteIcon from "@mui/icons-material/Delete"; // MUI: 삭제 아이콘
import SaveIcon from "@mui/icons-material/Save"; // MUI: 저장 아이콘
import AddIcon from "@mui/icons-material/Add"; // MUI: 추가 아이콘
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api/boardCategoryAPI"; // API 통신 모듈
import { handleApiError } from "../../../utils/handleError"; // 공통 에러 처리 함수

// 관리자용 카테고리 관리 페이지 컴포넌트
const AdminCategoryPage = () => {
  // React 상태 관리
  const [categories, setCategories] = useState([]); // 전체 카테고리 목록
  const [editingId, setEditingId] = useState(null); // 현재 수정 중인 카테고리 id
  const [editedData, setEditedData] = useState({ name: "", orderNo: "" }); // 수정 중 데이터
  const [newCategory, setNewCategory] = useState({ name: "", orderNo: "" }); // 새로 추가할 카테고리 데이터

  // 비동기로 전체 카테고리 조회
  const loadCategories = async () => {
    try {
      const res = await getAllCategories(); // 백엔드에서 전체 목록 조회
      // orderNo 기준 정렬
      const sorted = [...(res.data.data || [])].sort(
        (a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0)
      );
      setCategories(sorted); // 상태에 반영
    } catch (err) {
      handleApiError(err, "카테고리 조회 실패");
    }
  };

  // 컴포넌트 마운트 시 한 번 실행 → 카테고리 목록 불러오기
  useEffect(() => {
    loadCategories();
  }, []);

  // 수정 버튼 클릭 시 실행 → 수정 모드로 전환
  const handleEdit = (cat) => {
    setEditingId(cat.id); // 수정 중인 행 id 저장
    setEditedData({ name: cat.name, orderNo: cat.orderNo }); // 기존 데이터 입력 필드에 표시
  };

  // 저장 버튼 클릭 시 실행 → 수정 내용 반영
  const handleSave = async (id) => {
    try {
      await updateCategory(id, editedData); // API 요청으로 수정
      alert("카테고리가 수정되었습니다.");
      setEditingId(null); // 수정 모드 해제
      loadCategories(); // 목록 새로고침
    } catch (err) {
      handleApiError(err, "수정 실패");
    }
  };

  // 삭제 버튼 클릭 시 실행
  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return; // 사용자 확인
    try {
      await deleteCategory(id); // API 요청으로 삭제
      alert("삭제 완료");
      loadCategories(); // 목록 새로고침
    } catch (err) {
      handleApiError(err, "삭제 실패");
    }
  };

  // 등록 버튼 클릭 시 실행 → 신규 카테고리 생성
  const handleCreate = async () => {
    if (!newCategory.name.trim()) return alert("카테고리명을 입력하세요."); // 유효성 검사
    try {
      await createCategory(newCategory); // API 요청으로 등록
      alert("등록 완료");
      setNewCategory({ name: "", orderNo: "" }); // 입력 필드 초기화
      loadCategories(); // 목록 새로고침
    } catch (err) {
      handleApiError(err, "등록 실패");
    }
  };

  return (
    <Box sx={{ p: 3, width: "80%", mx: "auto" }}>
      {/* 페이지 제목 */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        카테고리 관리 (관리자 전용)
      </Typography>

      {/* 신규 카테고리 등록 영역 */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          label="카테고리명"
          size="small"
          value={newCategory.name}
          onChange={(e) =>
            setNewCategory((prev) => ({ ...prev, name: e.target.value }))
          } // 입력 변경 시 상태 업데이트
        />
        <TextField
          label="순서번호"
          size="small"
          type="number"
          inputProps={{ min: 0 }} // 0 이상만 입력 가능
          value={newCategory.orderNo}
          onChange={(e) =>
            setNewCategory((prev) => ({ ...prev, orderNo: e.target.value }))
          } // 입력 변경 시 상태 업데이트
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />} // 아이콘: 추가
          onClick={handleCreate} // 등록 버튼 클릭 시 실행
        >
          등록
        </Button>
      </Box>

      {/* 카테고리 목록 테이블 */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>카테고리명</TableCell>
            <TableCell>순서번호</TableCell>
            <TableCell align="center">액션</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* 카테고리 목록을 순회하며 행 생성 */}
          {categories.map((cat) => (
            <TableRow key={cat.id}>
              <TableCell>
                {/* 수정 모드일 때는 입력창 표시, 아닐 땐 텍스트만 표시 */}
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

              {/* 액션 버튼 영역 */}
              <TableCell align="center">
                {editingId === cat.id ? (
                  <IconButton color="primary" onClick={() => handleSave(cat.id)}>
                    <SaveIcon /> {/* 저장 아이콘 */}
                  </IconButton>
                ) : (
                  <IconButton color="secondary" onClick={() => handleEdit(cat)}>
                    <EditIcon /> {/* 수정 아이콘 */}
                  </IconButton>
                )}
                <IconButton color="error" onClick={() => handleDelete(cat.id)}>
                  <DeleteIcon /> {/* 삭제 아이콘 */}
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default AdminCategoryPage;
