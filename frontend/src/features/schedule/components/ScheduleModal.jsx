import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Stack,
  Autocomplete,
  Alert,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { toBackendFormat, toISO } from "../../../utils/dateFormat";
import {
  getMeetingRooms,
  getScheduleCategories,
  getUsers,
  checkRoomAvailable,
} from "../api/scheduleAPI";

export default function ScheduleModal({
  open,
  onClose,
  date,
  onSubmit,
  onDelete,
  initialData,
}) {
  const isEdit = !!initialData;
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm")); // 모바일일 때 전체화면 처리

  const [meetingRooms, setMeetingRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [roomAvailable, setRoomAvailable] = useState(true);

  const [form, setForm] = useState({
    title: "",
    content: "",
    location: "",
    startDateTime: date ? `${date} 09:00:00` : "",
    endDateTime: date ? `${date} 10:00:00` : "",
    meetingRoomId: "",
    categoryId: "",
    participantIds: [],
    visibility: "PRIVATE",
  });

  /** 공통 데이터 로드 */
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const [roomsRes, catsRes, usersRes] = await Promise.allSettled([
        getMeetingRooms(),
        getScheduleCategories(),
        getUsers(),
      ]);
      if (roomsRes.status === "fulfilled") setMeetingRooms(roomsRes.value);
      if (catsRes.status === "fulfilled") setCategories(catsRes.value);
      if (usersRes.status === "fulfilled") setUsers(usersRes.value);
    };
    load();
  }, [open]);

  /**  수정 모드라면 기존 값 채우기 */
  useEffect(() => {
    if (isEdit && initialData) {
      setForm({
        title: initialData.title || "",
        content: initialData.content || "",
        location: initialData.location || "",
        startDateTime: toISO(initialData.startDateTime),
        endDateTime: toISO(initialData.endDateTime),
        meetingRoomId: initialData.meetingRoomId || "",
        categoryId: initialData.categoryId || "",
        participantIds: initialData.participantIds || [],
        visibility: initialData.visibility || "PRIVATE",
      });
    }
  }, [initialData]);

  /** 회의실 예약 가능 여부 검사 */
  useEffect(() => {
    const checkAvailability = async () => {
      if (!form.meetingRoomId || !form.startDateTime || !form.endDateTime) return;
      const result = await checkRoomAvailable(
        form.meetingRoomId,
        form.startDateTime,
        form.endDateTime
      );
      setRoomAvailable(result.available);
    };
    checkAvailability();
  }, [form.meetingRoomId, form.startDateTime, form.endDateTime]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!roomAvailable) {
      alert("이 시간대에는 선택한 회의실이 이미 예약되어 있습니다.");
      return;
    }
    const payload = {
      ...form,
      startDateTime: toBackendFormat(form.startDateTime),
      endDateTime: toBackendFormat(form.endDateTime),
    };
    onSubmit(payload, isEdit);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      scroll="paper" // 내부 스크롤 자동 처리
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 0,
        },
      }}
    >
      {/* 제목 영역 */}
      <DialogTitle sx={{ fontWeight: 600, borderBottom: "1px solid #ddd" }}>
        {isEdit ? "일정 수정" : "일정 등록"}
      </DialogTitle>

      {/* 내용 영역 (자동 스크롤) */}
      <DialogContent dividers sx={{ p: 3 }}>
        <Stack spacing={2}>
          <TextField label="제목" name="title" value={form.title} onChange={handleChange} fullWidth />
          <TextField label="내용" name="content" value={form.content} onChange={handleChange} fullWidth />
          <TextField label="장소" name="location" value={form.location} onChange={handleChange} fullWidth />

          {/* 카테고리 */}
          <TextField
            select
            label="카테고리"
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            fullWidth
          >
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </TextField>

          {/* 회의실 */}
          <TextField
            select
            label="회의실"
            name="meetingRoomId"
            value={form.meetingRoomId}
            onChange={handleChange}
            fullWidth
          >
            {meetingRooms.map((room) => (
              <MenuItem key={room.id} value={room.id} disabled={!room.availableYn}>
                {room.name} {room.availableYn ? "" : "(예약 불가)"}
              </MenuItem>
            ))}
          </TextField>

          {!roomAvailable && (
            <Alert severity="warning">
              선택한 시간에는 해당 회의실이 이미 예약되어 있습니다.
            </Alert>
          )}

          {/* 참여자 선택 */}
          <Autocomplete
            multiple
            options={users}
            getOptionLabel={(option) => `${option.name} (${option.email})`}
            value={users.filter((u) => form.participantIds.includes(u.id))}
            onChange={(e, selected) =>
              setForm((prev) => ({
                ...prev,
                participantIds: selected.map((s) => s.id),
              }))
            }
            renderInput={(params) => (
              <TextField {...params} label="참여자 초대" placeholder="검색 후 선택" />
            )}
          />

          {/* 시간 선택 */}
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
        </Stack>
      </DialogContent>

      {/* 하단 버튼 (항상 고정) */}
      <DialogActions sx={{ borderTop: "1px solid #ddd", p: 2 }}>
        {isEdit && (
          <Button color="error" onClick={() => onDelete(initialData.id)}>
            삭제
          </Button>
        )}
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {isEdit ? "수정" : "등록"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
