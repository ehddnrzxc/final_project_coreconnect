import React, { useState } from "react";
import {
  Modal,
  Box,
  TextField,
  Button,
  Typography,
} from "@mui/material";

export default function ScheduleModal({ open, onClose, date, onSubmit }) {
  const [form, setForm] = useState({
    title: "",
    content: "",
    startDateTime: `${date}T09:00`,
    endDateTime: `${date}T10:00`,
    location: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = () => {
    onSubmit(form);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "white",
          p: 3,
          borderRadius: 2,
          boxShadow: 24,
          width: 400,
        }}
      >
        <Typography variant="h6" mb={2}>새 일정 추가</Typography>

        <TextField
          fullWidth
          label="제목"
          name="title"
          value={form.title}
          onChange={handleChange}
          sx={{ mb: 1.5 }}
        />

        <TextField
          fullWidth
          label="내용"
          name="content"
          value={form.content}
          onChange={handleChange}
          sx={{ mb: 1.5 }}
        />

        <TextField
          fullWidth
          label="장소"
          name="location"
          value={form.location}
          onChange={handleChange}
          sx={{ mb: 1.5 }}
        />

        <Button
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          sx={{ bgcolor: "#00a0e9", "&:hover": { bgcolor: "#0090d2" } }}
        >
          등록
        </Button>
      </Box>
    </Modal>
  );
}
