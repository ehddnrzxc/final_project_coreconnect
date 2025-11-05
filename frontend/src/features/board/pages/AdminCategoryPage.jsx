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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api/boardCategoryAPI";

const AdminCategoryPage = () => {
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editedData, setEditedData] = useState({ name: "", orderNo: "" });
  const [newCategory, setNewCategory] = useState({ name: "", orderNo: "" });

  const loadCategories = async () => {
    try {
      const res = await getAllCategories();
      const sorted = [...(res.data.data || [])].sort(
        (a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0)
      );
      setCategories(sorted);
    } catch (err) {
      console.error("카테고리 조회 실패:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setEditedData({ name: cat.name, orderNo: cat.orderNo });
  };

  const handleSave = async (id) => {
    try {
      await updateCategory(id, editedData);
      setEditingId(null);
      loadCategories();
    } catch (err) {
      alert("수정 실패");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteCategory(id);
      loadCategories();
    } catch (err) {
      alert("삭제 실패");
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!newCategory.name.trim()) return alert("카테고리명을 입력하세요.");
    try {
      await createCategory(newCategory);
      setNewCategory({ name: "", orderNo: "" });
      loadCategories();
    } catch (err) {
      alert("등록 실패");
      console.error(err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        🛠️ 카테고리 관리 (관리자 전용)
      </Typography>

      {/* 신규 등록 */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          label="카테고리명"
          size="small"
          value={newCategory.name}
          onChange={(e) =>
            setNewCategory((prev) => ({ ...prev, name: e.target.value }))
          }
        />
        <TextField
          label="순서번호"
          size="small"
          type="number"
          inputProps={{ min: 0 }} 
          value={newCategory.orderNo}
          onChange={(e) =>
            setNewCategory((prev) => ({ ...prev, orderNo: e.target.value }))
          }
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          등록
        </Button>
      </Box>

      {/* 카테고리 테이블 */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>카테고리명</TableCell>
            <TableCell>순서번호</TableCell>
            <TableCell align="center">액션</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {categories.map((cat) => (
            <TableRow key={cat.id}>
              <TableCell>
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
              <TableCell align="center">
                {editingId === cat.id ? (
                  <IconButton color="primary" onClick={() => handleSave(cat.id)}>
                    <SaveIcon />
                  </IconButton>
                ) : (
                  <IconButton color="secondary" onClick={() => handleEdit(cat)}>
                    <EditIcon />
                  </IconButton>
                )}
                <IconButton color="error" onClick={() => handleDelete(cat.id)}>
                  <DeleteIcon />
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