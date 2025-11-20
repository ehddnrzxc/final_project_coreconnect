import React, { useEffect, useState} from "react";
import {
  Box, Stack, Typography, Checkbox, IconButton,
  Popover, Grid, Tooltip, Button, Dialog,
  DialogTitle, DialogContent, DialogActions,
  TextField
} from "@mui/material";
import { ColorLens, Delete, Add, Edit } from "@mui/icons-material";
import {
  getScheduleCategories,
  createScheduleCategory,
  updateScheduleCategory,
  deleteScheduleCategory,
} from "../api/scheduleAPI";
import { useSnackbarContext } from "../../../components/utils/SnackbarContext";

const COLOR_PALETTE = [ 
  "#EF5350","#F06292","#BA68C8","#7986CB","#64B5F6",
  "#4DD0E1","#4DB6AC","#81C784","#DCE775","#FFD54F",
  "#FFB74D","#A1887F","#90A4AE","#B0BEC5","#E57373",
  "#FF8A65","#9575CD","#4FC3F7","#AED581","#FFB300"
];

export default function ScheduleCategoryPanel({ activeCategories, onToggle, onColorChange, categoryColors }) {
  const [categories, setCategories] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { showSnack } = useSnackbarContext();


  // Dialog 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // "add" | "edit"
  const [inputValue, setInputValue] = useState("");

  /** 초기 카테고리 로드 */
  useEffect(() => {
    const load = async () => {
      const list = await getScheduleCategories();
      setCategories(list);
    };
    load();
  }, []);

  /** 색상 선택 시 부모에 전달 */
  const handleSelectColor = (color) => {
    if (!selectedCategory) return;
    onColorChange(selectedCategory.id, color);
    setAnchorEl(null);
  };

  /** Dialog 열기 (추가 or 수정) */
  const openDialog = (mode, category) => {
    setDialogMode(mode);
    setInputValue(category?.name || "");
    setSelectedCategory(category || null);
    setDialogOpen(true);
  };

  /** Dialog 저장 */
  const handleDialogSubmit = async () => {
    if (!inputValue.trim()) {
      showSnack("카테고리 이름을 입력하세요.", "warning");
      return;
    }
    try {
      if (dialogMode === "add") {
        // 새 카테고리 생성
        const created = await createScheduleCategory({ name: inputValue, defaultYn: false });
        setCategories((prev) => [...prev, created]);

        const defaultColor = "#00a0e9";
        onColorChange(created.id, defaultColor);

      } else if (dialogMode === "edit" && selectedCategory) {
        // 기존 카테고리 이름 수정
        const updated = await updateScheduleCategory(selectedCategory.id, {
          name: inputValue,
          defaultYn: selectedCategory.defaultYn,
        });
        setCategories((prev) =>
          prev.map((c) => (c.id === selectedCategory.id ? updated : c))
        );
      }
    } catch (err) {
      showSnack(err.message || "카테고리 저장 중 오류 발생", "error");
    } finally {
      setDialogOpen(false);
    }
  };

  /** 삭제 */
  const handleDelete = async (id) => {
    await deleteScheduleCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    };

  /** 렌더링 */
  return (
    <Box
      sx={{
        width: 250,
        borderRight: "1px solid #ddd",
        p: 2,
        height: "100%", 
        overflowY: "auto",
        overflowX: "hidden",  
        "&::-webkit-scrollbar": { width: 6 },
        "&::-webkit-scrollbar-thumb": { backgroundColor: "#bbb", borderRadius: 3 }
      }}
    >
      <Typography variant="h6" mb={1}>내 캘린더</Typography>

      <Stack spacing={1}>
        {categories.map((cat) => (
          <Stack key={cat.id} direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
              <Checkbox
                checked={activeCategories.includes(cat.id)}
                onChange={() => onToggle(cat.id)}
                sx={{ color: categoryColors[cat.id] || "#999", "&.Mui-checked": { color: categoryColors[cat.id] || "#999" } }}
              />
              <Typography 
                sx={{ 
                  color: categoryColors[cat.id] || "#999", 
                  fontSize: 15,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {cat.name}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={0.5}>
              <Tooltip title="색상 변경">
                <IconButton size="small" onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedCategory(cat); }}>
                  <ColorLens fontSize="small" />
                </IconButton>
              </Tooltip>
              {!cat.defaultYn && (
                <Tooltip title="이름 수정">
                  <IconButton size="small" onClick={() => openDialog("edit", cat)}>
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {!cat.defaultYn && (
                <Tooltip title="삭제">
                  <IconButton size="small" onClick={() => handleDelete(cat.id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Stack>
        ))}
      </Stack>

      <Button startIcon={<Add />} onClick={() => openDialog("add")} fullWidth sx={{ mt: 2 }}>
        새 카테고리 추가
      </Button>

      {/* 색상 선택 팝오버 */}
      <Popover open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={() => setAnchorEl(null)}>
        <Box sx={{ p: 1.5 }}>
          <Grid container spacing={1}>
            {COLOR_PALETTE.map((color) => (
              <Grid item key={color}>
                <Box
                  onClick={() => handleSelectColor(color)}
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    bgcolor: color,
                    cursor: "pointer",
                    border:
                      categoryColors[selectedCategory?.id] === color
                        ? "2px solid #333"
                        : "1px solid #ccc",
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Popover>

      {/* 카테고리 추가/수정 Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{dialogMode === "add" ? "새 카테고리 추가" : "카테고리 이름 수정"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="카테고리 이름"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault(); // 폼 기본 submit 막기
                handleDialogSubmit(); // 확인 버튼과 동일한 함수 실행
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleDialogSubmit}>
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
