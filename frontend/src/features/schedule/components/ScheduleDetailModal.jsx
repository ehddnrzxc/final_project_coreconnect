import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stack,
  Typography,
  CircularProgress,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { getScheduleById } from "../api/scheduleAPI";
import { getParticipantsBySchedule } from "../api/scheduleParticipantAPI";
import { useSnackbarContext } from "../../../components/utils/SnackbarContext";

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
  const { showSnack } = useSnackbarContext();

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm")); // 모바일 대응

   /** 모달이 닫힐 때 상태 초기화 */
  useEffect(() => {
    if (!open) {
      setSchedule(null);
      setParticipants([]);
      setLoading(true);
    }
  }, [open]);

  /** 일정 + 참여자 로드 */
  useEffect(() => {
    if (!open || !scheduleId) return;

    let cancelled = false; // 언마운트 후 setState 방지 플래그

    setLoading(true);
    const load = async () => {
      try {
        const [s, p] = await Promise.all([
          getScheduleById(scheduleId),
          getParticipantsBySchedule(scheduleId),
        ]);
        if (cancelled) return;

        const normalized = Array.isArray(p) ? p : [p];
        setSchedule(s);
        setParticipants(normalized);
      } catch (err) {
         if (!cancelled) {
           showSnack("상세 일정 조회 중 오류가 발생했습니다.", "error");
         }
      } finally {
         if (!cancelled) {
           setLoading(false);
         }
      }
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [open, scheduleId]);

  if (!open) return null;

  const isOwner = schedule?.userEmail === currentUserEmail;
  const isParticipant =
    Array.isArray(participants) &&
    participants.some((p) => p.userEmail === currentUserEmail);

  const canEdit = isOwner || isParticipant;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
      scroll="paper"
      PaperProps={{
        sx: { borderRadius: 2, p: 0 },
      }}
    >
      {/* 제목 영역 */}
      <DialogTitle
        sx={{
          fontWeight: 600,
          borderBottom: "1px solid #ddd",
        }}
      >
        일정 상세보기
      </DialogTitle>

      {/* 내용 영역 (스크롤 가능) */}
      <DialogContent dividers sx={{ p: 3 }}>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" p={4}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>
              일정 정보를 불러오는 중입니다...
            </Typography>
          </Stack>
        ) : (
          <>
            {/* 제목 + 공개여부 */}
            <Stack direction="row" alignItems="center" spacing={1}>
              {schedule.visibility === "PRIVATE" && <span>🔒</span>}
              <Typography variant="h6">{schedule.title}</Typography>
            </Stack>

            {/* 시간 */}
            <Typography variant="body2" color="text.secondary">
              {schedule.startDateTime} ~ {schedule.endDateTime}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* 내용 */}
            <Typography sx={{ whiteSpace: "pre-line" }}>
              {schedule.content || "(내용 없음)"}
            </Typography>

            {/* 기본 정보 */}
            <Stack spacing={0.5} mt={2}>
              <Typography variant="body2">
                장소: {schedule.location || "-"}
              </Typography>
              <Typography variant="body2">
                회의실: {schedule.meetingRoomName || "-"}
              </Typography>
              <Typography variant="body2">
                카테고리: {schedule.categoryName || "-"}
              </Typography>
              <Typography variant="body2">
                작성자: {schedule.userName || "-"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                작성일: {schedule.createdAt || "-"}
              </Typography>
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
                      color:
                        p.role === "OWNER"
                          ? "primary.main"
                          : "text.primary",
                    }}
                  >
                    • {p.userName}{" "}
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                    >
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
          </>
        )}
      </DialogContent>

      {/* 하단 버튼 고정 영역 */}
      <DialogActions
        sx={{
          borderTop: "1px solid #ddd",
          p: 2,
        }}
      >
        <Button variant="outlined" onClick={onClose}>
          닫기
        </Button>
        {canEdit && (
          <>
            <Button
              variant="contained"
              onClick={() =>
                onEdit({
                  ...schedule,
                  participantIds: participants.map((p) => p.userId),
                })
              }
            >
              수정
            </Button>
            {isOwner && (
              <Button
                variant="contained"
                color="error"
                onClick={() => onDelete(schedule.id)}
              >
                삭제
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
