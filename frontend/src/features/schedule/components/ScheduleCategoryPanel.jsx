import React, { useEffect, useState } from "react";
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

const COLOR_PALETTE = [ "#EF5350","#F06292","#BA68C8","#7986CB","#64B5F6",
  "#4DD0E1","#4DB6AC","#81C784","#DCE775","#FFD54F","#FFB74D","#A1887F",
  "#90A4AE","#B0BEC5","#E57373","#FF8A65","#9575CD","#4FC3F7","#AED581","#FFB300"
];
const getRandomColor = () => COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];

export default function ScheduleCategoryPanel({ activeCategories, onToggle, onColorChange }) {
  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { showSnack } = useSnackbarContext();


  // Dialog 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // "add" | "edit"
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const load = async () => {
      const list = await getScheduleCategories();
      setCategories(list);
      const savedColors = JSON.parse(localStorage.getItem("categoryColors") || "{}");
      const newColors = {};
      list.forEach((cat) => {
        newColors[cat.id] = savedColors[cat.id] || getRandomColor();
      });
      setColors(newColors);
    };
    load();
  }, []);

  /** 색상 선택 */
  const handleSelectColor = (color) => {
    if (!selectedCategory) return;
    const newColors = { ...colors, [selectedCategory.id]: color };
    setColors(newColors);
    localStorage.setItem("categoryColors", JSON.stringify(newColors));
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
        const created = await createScheduleCategory({ name: inputValue, defaultYn: false });
        const color = getRandomColor();
        setCategories((prev) => [...prev, created]);
        setColors((prev) => ({ ...prev, [created.id]: color }));
        localStorage.setItem("categoryColors", JSON.stringify({ ...colors, [created.id]: color }));
      } else if (dialogMode === "edit" && selectedCategory) {
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
    const updated = { ...colors };
    delete updated[id];
    setColors(updated);
    localStorage.setItem("categoryColors", JSON.stringify(updated));
  };

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
            <Stack direction="row" alignItems="center" spacing={1}>
              <Checkbox
                checked={activeCategories.includes(cat.id)}
                onChange={() => onToggle(cat.id)}
                sx={{ color: colors[cat.id], "&.Mui-checked": { color: colors[cat.id] } }}
              />
              <Typography sx={{ color: colors[cat.id], fontSize: 15 }}>
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
                      colors[selectedCategory?.id] === color
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
