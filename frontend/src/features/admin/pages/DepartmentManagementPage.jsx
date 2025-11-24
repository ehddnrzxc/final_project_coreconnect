import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import StyledButton from "../../../components/ui/StyledButton";
import ConfirmDialog from "../../../components/utils/ConfirmDialog";
import {
  fetchDepartmentsFlat,
  createDepartment,
  updateDepartment,
  moveDepartment,
  deleteDepartment,
  fetchDepartmentTree,
} from "../api/departmentAPI";

export default function DepartmentManagementPage() {
  const [departments, setDepartments] = useState([]);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [originParent, setOriginParent] = useState(null);
  const [form, setForm] = useState({ name: "", orderNo: 10, parentId: "" });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const parentMap = useMemo(() => {
    const map = new Map();
    departments.forEach((dept) => map.set(dept.id, dept.name));
    return map;
  }, [departments]);

  const loadDepartments = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const treeData = await fetchDepartmentTree();
      const safeTree = treeData ?? [];
      setTree(safeTree);

      const flat = [];
      const flatten = (nodes, parentId = null) => {
        nodes.forEach((node) => {
          flat.push({
            id: node.id,
            name: node.name,
            orderNo: node.orderNo,
            parentId,
            userCount: node.userCount,
          });
          if (node.children?.length) {
            flatten(node.children, node.id);
          }
        });
      };
      flatten(safeTree);
      setDepartments(flat);
    } catch (err) {
      console.error("부서 목록 불러오기 실패:", err);
      setMessage({ type: "error", text: "부서 목록을 불러오지 못했습니다." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const resetForm = () => {
    setForm({ name: "", orderNo: 10, parentId: "" });
    setEditingId(null);
    setOriginParent(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setMessage({ type: "warning", text: "부서 이름을 입력하세요." });
      return;
    }

    const payload = {
      name: form.name.trim(),
      orderNo: Number(form.orderNo) || 0,
      parentId: form.parentId === "" ? null : Number(form.parentId),
    };

    setSubmitting(true);
    setMessage(null);

    try {
      if (editingId) {
        await updateDepartment(editingId, {
          name: payload.name,
          orderNo: payload.orderNo,
        });

        if (payload.parentId !== originParent) {
          await moveDepartment(editingId, payload.parentId);
        }

        setMessage({ type: "success", text: "부서가 수정되었습니다." });
      } else {
        await createDepartment(payload);
        setMessage({ type: "success", text: "새 부서가 생성되었습니다." });
      }

      resetForm();
      await loadDepartments();
    } catch (err) {
      console.error("부서 저장 실패:", err);
      const msg = err.response?.data || "부서를 저장하는 중 오류가 발생했습니다.";
      setMessage({ type: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const applyEdit = (dept) => {
    setEditingId(dept.id);
    setOriginParent(dept.parentId ?? null);
    setForm({
      name: dept.name,
      orderNo: dept.orderNo ?? 0,
      parentId: dept.parentId ?? "",
    });
  };

  const handleEdit = (dept) => applyEdit(dept);

  const handleDeleteClick = (dept) => {
    setDeleteTarget(dept);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setDeleteConfirmOpen(false);
    setSubmitting(true);
    setMessage(null);
    try {
      await deleteDepartment(deleteTarget.id);
      setMessage({ type: "success", text: "부서가 삭제되었습니다." });
      if (editingId === deleteTarget.id) {
        resetForm();
      }
      await loadDepartments();
    } catch (err) {
      console.error("부서 삭제 실패:", err);
      const msg = err.response?.data || "부서를 삭제하는 중 오류가 발생했습니다.";
      setMessage({ type: "error", text: msg });
    } finally {
      setSubmitting(false);
      setDeleteTarget(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  const availableParents = useMemo(() => {
    if (!editingId) return departments;
    return departments.filter((dept) => dept.id !== editingId);
  }, [departments, editingId]);

  const renderTree = (nodes, depth = 0, parentId = null) =>
    nodes.map((node) => (
      <Box key={node.id} sx={{ pl: depth * 3, py: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {node.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ID {node.id} · 정렬 {node.orderNo ?? "-"} · 구성원 {node.userCount ?? 0}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <IconButton
              size="small"
              onClick={() =>
                applyEdit({
                  id: node.id,
                  name: node.name,
                  orderNo: node.orderNo ?? 0,
                  parentId,
                  userCount: node.userCount,
                })
              }
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() =>
                handleDeleteClick({
                  id: node.id,
                  name: node.name,
                })
              }
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
        {node.children?.length ? renderTree(node.children, depth + 1, node.id) : null}
      </Box>
    ));

  return (
    <Box sx={{ px: 4, py: 3, width: "100%", maxWidth: 1400, mx: "auto" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
            부서 관리
          </Typography>
          <Typography variant="body2" color="text.secondary">
            부서를 생성하고 수정하거나 삭제할 수 있습니다.
          </Typography>
        </Box>
        <IconButton onClick={loadDepartments} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Stack>

      {message && (
        <Alert
          severity={message.type}
          onClose={() => setMessage(null)}
          sx={{ mb: 3 }}
        >
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 10px 24px rgba(15,23,42,0.08)" }}>
            <CardContent component="form" onSubmit={handleSubmit}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                {editingId ? "부서 수정" : "새 부서 추가"}
              </Typography>
              <Stack spacing={2.2}>
                <TextField
                  label="부서 이름"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="예: 경영지원팀"
                  fullWidth
                />
                <TextField
                  label="정렬 순서"
                  type="number"
                  value={form.orderNo}
                  onChange={(e) => setForm((prev) => ({ ...prev, orderNo: e.target.value }))}
                  inputProps={{ min: 0 }}
                  fullWidth
                />
                <TextField
                  select
                  label="상위 부서"
                  value={form.parentId}
                  onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value }))}
                  helperText="최상위 부서는 비워 두세요"
                >
                  <MenuItem value="">(최상위 부서)</MenuItem>
                  {availableParents.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
                <StyledButton
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  disabled={submitting}
                  fullWidth={false}
                  sx={{ color: "primary.main" }}
                >
                  {editingId ? "수정 저장" : "부서 생성"}
                </StyledButton>
                {editingId && (
                  <StyledButton variant="text" onClick={resetForm} disabled={submitting} fullWidth={false}>
                    취소
                  </StyledButton>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 10px 24px rgba(15,23,42,0.05)" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                부서 트리 ({departments.length}개)
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {loading ? (
                <Typography variant="body2" color="text.secondary">
                  부서 정보를 불러오는 중...
                </Typography>
              ) : tree.length > 0 ? (
                <Box>{renderTree(tree)}</Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  등록된 부서가 없습니다.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="부서 삭제 확인"
        message={`부서 "${deleteTarget?.name}" 을(를) 삭제하시겠습니까?\n하위 부서가 있는 경우 삭제할 수 없습니다.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </Box>
  );
}
