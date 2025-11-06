import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Box, Typography, CircularProgress } from "@mui/material";
import { getMySchedules, createSchedule, updateSchedule, deleteSchedule } from "../api/scheduleAPI";
import { toISO } from "../../../utils/dateFormat";
import ScheduleModal from "../components/ScheduleModal";
import useSnackbar from "../../../hooks/useSnackbar";

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
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

  /** 일정 클릭 → 수정 모달 */
  const handleEventClick = (info) => {
    const clicked = events.find((e) => e.id === Number(info.event.id));
    if (clicked) {
      setSelectedEvent({
        ...clicked,
        startDateTime: toISO(clicked.start),
        endDateTime: toISO(clicked.end),
      });
      setModalOpen(true);
    }
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
      const message =
        err.message || (isEdit ? "일정 수정 실패" : "일정 등록 실패");
      showSnack(message, "error");
    }
  };

  /** 일정 삭제 */
  const handleDelete = async (id) => {
    try {
      await deleteSchedule(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      showSnack("일정이 삭제되었습니다", "info");
      setModalOpen(false);
    } catch (err) {
      const message = err.message || "일정 삭제 실패";
      showSnack(message, "error");
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
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth" // 기본은 월간으로 시작
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        height="auto"
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          meridiem: false,
        }}
      />

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
