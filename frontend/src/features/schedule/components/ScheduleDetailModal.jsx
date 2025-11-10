import React, { useEffect, useState } from "react";
import {
  Modal, Box, Typography, Divider, Stack, CircularProgress, Button,
} from "@mui/material";
import { getScheduleById } from "../api/scheduleAPI";
import { getParticipantsBySchedule } from "../api/scheduleParticipantAPI";

export default function ScheduleDetailModal({
  open,
  onClose,
  scheduleId,
  onEdit,
  onDelete,
  currentUserEmail,
}) {
  const [schedule, setSchedule] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  /** 일정 + 참여자 로드 */
  useEffect(() => {
    if (!open || !scheduleId) return;

    setLoading(true);
    const load = async () => {
      try {
        const [s, p] = await Promise.all([
          getScheduleById(scheduleId),
          getParticipantsBySchedule(scheduleId),
        ]);
        const normalized = Array.isArray(p) ? p : [p];
        setSchedule(s);
        setParticipants(normalized);
      } catch (err) {
        console.error("상세 일정 조회 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, scheduleId]);

  if (!open) return null;

  const isOwner = schedule?.userEmail === currentUserEmail;

  const isParticipant =
    Array.isArray(participants) &&
    participants.some((p) => p.userEmail === currentUserEmail);

  const canEdit = isOwner || isParticipant;

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          width: 420,
          bgcolor: "background.paper",
          p: 3,
          borderRadius: 2,
          mx: "auto",
          mt: "12vh",
          boxShadow: 24,
          outline: "none",
        }}
      >
        {loading ? (
          <Stack alignItems="center" justifyContent="center" p={4}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>
              일정 정보를 불러오는 중입니다...
            </Typography>
          </Stack>
        ) : (
          <>
            {/* 제목 + 공개여부 아이콘 */}
            <Stack direction="row" alignItems="center" spacing={1}>
              {schedule.visibility === "PRIVATE" && <span>🔒</span>}
              <Typography variant="h6">{schedule.title}</Typography>
            </Stack>

            {/* 일정 시간 표시 */}
            <Typography variant="body2" color="text.secondary">
              {schedule.startDateTime} ~ {schedule.endDateTime}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* 일정 내용 */}
            <Typography sx={{ whiteSpace: "pre-line" }}>
              {schedule.content || "(내용 없음)"}
            </Typography>

            {/* 기본 정보 */}
            <Stack spacing={0.5} mt={2}>
              <Typography variant="body2">장소: {schedule.location || "-"}</Typography>
              <Typography variant="body2">회의실: {schedule.meetingRoomName || "-"}</Typography>
              <Typography variant="body2">카테고리: {schedule.categoryName || "-"}</Typography>
              <Typography variant="body2">작성자: {schedule.userName || "-"}</Typography>
              <Typography variant="body2" color="text.secondary">작성일: {schedule.createdAt || "-"}</Typography>
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* 참여자 목록 */}
            <Typography variant="subtitle1" fontWeight={600} mb={0.5}>
              참여자 목록
            </Typography>
            {participants.length > 0 ? (
              <Stack spacing={0.5}>
                {participants.map((p) => (
                  <Typography
                    key={p.id}
                    variant="body2"
                    sx={{
                      fontWeight: p.role === "OWNER" ? 700 : 400,
                      color: p.role === "OWNER" ? "primary.main" : "text.primary",
                    }}
                  >
                    • {p.userName}{" "}
                    <Typography component="span" variant="caption" color="text.secondary">
                      ({p.role === "OWNER" ? "생성자" : "참석자"})
                    </Typography>
                  </Typography>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                참여자 없음
              </Typography>
            )}

            {/* 하단 버튼: OWNER 전용 수정/삭제 */}
            <Stack direction="row" spacing={1} justifyContent="flex-end" mt={2}>
              <Button variant="outlined" onClick={onClose}>닫기</Button>
              {canEdit  && (
                <>
                  <Button variant="contained" onClick={() => onEdit(schedule)}>수정</Button>
                  {isOwner && (
                  <Button variant="contained" color="error" onClick={() => onDelete(schedule.id)}>삭제</Button>
                  )}
                </>
              )}
            </Stack>
          </>
        )}
      </Box>
    </Modal>
  );
}