import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { Box, Typography, CircularProgress } from "@mui/material";
import { getMySchedules, createSchedule, updateSchedule, deleteSchedule } from "../api/scheduleAPI";
import { toISO } from "../../../utils/dateFormat";
import ScheduleModal from "../components/ScheduleModal";
import ScheduleDetailModal from "../components/ScheduleDetailModal";
import useSnackbar from "../../../hooks/useSnackbar";

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const { snack, showSnack, closeSnack } = useSnackbar();

  /** 내 일정 조회 */
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const data = await getMySchedules();
        const mapped = data.map((s) => ({
          id: s.id,
          title: s.title,
          start: toISO(s.startDateTime),
          end: toISO(s.endDateTime),
          content: s.content,
          location: s.location,
          backgroundColor: "#00a0e9",
          borderColor: "#00a0e9",
        }));
        setEvents(mapped);
      } catch {
        showSnack("일정 불러오기 실패", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, []);

  /** 날짜 클릭 → 새 일정 등록 */
  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr);
    setSelectedEvent(null);
    setModalOpen(true);
  };

  /** 수정: 일정 클릭 → 상세보기 모달 열기 */
  const handleEventClick = (info) => {
    setDetailId(Number(info.event.id));
    setDetailOpen(true);
  };

  /** 일정 등록 or 수정 */
  const handleSubmit = async (formData, isEdit) => {
    try {
      if (isEdit && selectedEvent) {

        const updated = await updateSchedule(selectedEvent.id, formData);

        setEvents((prev) =>
          prev.map((e) =>
            e.id === selectedEvent.id
              ? {
                  ...e,
                  title: updated.title,
                  start: toISO(updated.startDateTime),
                  end: toISO(updated.endDateTime),
                  content: updated.content,
                  location: updated.location,
                }
              : e
          )
        );
        showSnack("일정이 수정되었습니다", "success");
      } else {
        const created = await createSchedule(formData);
        const newEvent = {
          id: created.id,
          title: created.title,
          start: toISO(created.startDateTime),
          end: toISO(created.endDateTime),
          content: created.content,
          location: created.location,
          backgroundColor: "#00a0e9",
          borderColor: "#00a0e9",
        };
        setEvents((prev) => [...prev, newEvent]);
        showSnack("일정이 등록되었습니다", "success");
      }
      setModalOpen(false);
    } catch (err) {
      showSnack(err.message || "일정 처리 중 오류", "error");
    }
  };

  /** 일정 삭제 */
  const handleDelete = async (id) => {
    try {
      await deleteSchedule(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      showSnack("일정이 삭제되었습니다", "info");
      setModalOpen(false);
      setDetailOpen(false);
    } catch (err) {
      showSnack(err.message || "삭제 실패", "error");
    }
  };

  /** 로딩 중 */
  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>일정을 불러오는 중...</Typography>
      </Box>
    );
  }

  /** 렌더링 */
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={2}>
        내 캘린더
      </Typography>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth" // 기본은 월간
        headerToolbar={{
          left: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          center: "title",
          right: "prev,next today",
        }}
        buttonText={{
          today: "오늘",
          month: "월간",
          week: "주간",
          day: "일간",
          list: "목록",
        }}
        height="auto"
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        slotMinTime="08:00:00"
        slotMaxTime="21:00:00"
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false, // 일정(이벤트) 표시 24시간제
        }}
        slotLabelFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false, // 시간축(8PM → 20:00)
        }}
        />

      {/* 일정 등록/수정 모달 */}
      {modalOpen && (
        <ScheduleModal
          open={modalOpen}
          date={selectedDate}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          initialData={selectedEvent}
        />
      )}

      {/* 일정 상세보기 모달 */}
      {detailOpen && (
        <ScheduleDetailModal
          open={detailOpen}
          scheduleId={detailId}
          onClose={() => setDetailOpen(false)}
          onEdit={(data) => {
            setSelectedEvent(data);
            setModalOpen(true);
            setDetailOpen(false);
          }}
          onDelete={handleDelete}
        />
      )}

      {/* 전역 알림 */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeSnack}
          severity={snack.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
