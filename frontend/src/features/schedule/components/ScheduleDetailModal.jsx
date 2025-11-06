import React, { useEffect, useState } from "react";
import {
  Modal, Box, Typography, Divider, Stack, CircularProgress, Button,
} from "@mui/material";
import { getScheduleById } from "../api/scheduleAPI";
import { getParticipantsBySchedule } from "../api/participantAPI";

export default function ScheduleDetailModal({
  open,
  onClose,
  scheduleId,
  onEdit,
  onDelete,
}) {
  const [schedule, setSchedule] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  /** 일정 + 참여자 로드 */
  useEffect(() => {
    if (!open || !scheduleId) return;
    const load = async () => {
      try {
        const [s, p] = await Promise.all([
          getScheduleById(scheduleId),
          getParticipantsBySchedule(scheduleId),
        ]);
        setSchedule(s);
        setParticipants(p);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, scheduleId]);

  if (!open) return null;

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
        {loading ? (
          <Stack alignItems="center" justifyContent="center" p={3}>
            <CircularProgress />
          </Stack>
        ) : (
          <>
            <Typography variant="h6">{schedule.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {schedule.startDateTime} ~ {schedule.endDateTime}
            </Typography>

            <Divider sx={{ my: 2 }} />
            <Typography>{schedule.content || "(내용 없음)"}</Typography>

            <Stack spacing={0.5} mt={2}>
              <Typography variant="body2">장소: {schedule.location || "-"}</Typography>
              <Typography variant="body2">회의실: {schedule.meetingRoomName || "-"}</Typography>
              <Typography variant="body2">카테고리: {schedule.categoryName || "-"}</Typography>
              <Typography variant="body2">작성자: {schedule.userName || "-"}</Typography>
            </Stack>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1">참여자 목록</Typography>
            {participants.length > 0 ? (
              participants.map((p) => (
                <Typography key={p.id} variant="body2">
                  • {p.userName} ({p.role})
                </Typography>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                참여자 없음
              </Typography>
            )}

            <Stack direction="row" spacing={1} justifyContent="flex-end" mt={2}>
              <Button onClick={onClose}>닫기</Button>
              <Button onClick={() => onEdit(schedule)}>수정</Button>
              <Button color="error" onClick={() => onDelete(schedule.id)}>
                삭제
              </Button>
            </Stack>
          </>
        )}
      </Box>
    </Modal>
  );
}
