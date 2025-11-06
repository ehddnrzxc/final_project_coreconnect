import React, { useState, useEffect } from "react";
import { toBackendFormat, toISO } from "../../../utils/dateFormat";
import {
  Modal,
  Box,
  TextField,
  Typography,
  Button,
  Stack,
} from "@mui/material";

export default function ScheduleModal({
  open,
  onClose,
  date,
  onSubmit,
  onDelete,
  initialData, // 수정 시 기존 일정 데이터
}) {
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    title: "",
    content: "",
    location: "",
    startDateTime: date ? `${date} 09:00:00` : "",
    endDateTime: date ? `${date} 10:00:00` : "",
  });

  // 수정 모드라면 초기값 세팅
  useEffect(() => {
    if (isEdit && initialData) {
      setForm({
        title: initialData.title || "",
        content: initialData.content || "",
        location: initialData.location || "",
        startDateTime: toISO(initialData.startDateTime),
        endDateTime: toISO(initialData.endDateTime),
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const payload = {
      title: form.title,
      content: form.content,
      location: form.location,
      startDateTime: toBackendFormat(form.startDateTime),
      endDateTime: toBackendFormat(form.endDateTime),
      visibility: "PRIVATE",
    };
    onSubmit(payload, isEdit);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          width: 420,
          bgcolor: "background.paper",
          p: 3,
          borderRadius: 2,
          mx: "auto",
          mt: "15vh",
          boxShadow: 24,
        }}
      >
        <Typography variant="h6" mb={2}>
          {isEdit ? "일정 수정" : "일정 등록"}
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="제목"
            name="title"
            value={form.title}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="내용"
            name="content"
            value={form.content}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="장소"
            name="location"
            value={form.location}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="시작 시간"
            name="startDateTime"
            type="datetime-local"
            value={form.startDateTime ? form.startDateTime.replace(" ", "T") : ""}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="종료 시간"
            name="endDateTime"
            type="datetime-local"
            value={form.endDateTime ? form.endDateTime.replace(" ", "T") : ""}
            onChange={handleChange}
            fullWidth
          />

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            {isEdit && (
              <Button
                color="error"
                onClick={() => onDelete(initialData.id)}
              >
                삭제
              </Button>
            )}
            <Button onClick={onClose}>취소</Button>
            <Button variant="contained" onClick={handleSubmit}>
              {isEdit ? "수정" : "등록"}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}
