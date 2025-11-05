import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Box, Typography, CircularProgress } from "@mui/material";
import { getMySchedules, createSchedule } from "../api/scheduleAPI";
import { toISO } from "../../../utils/dateFormat";
import ScheduleModal from "../components/ScheduleModal";

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

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
          backgroundColor: "#00a0e9",
          borderColor: "#00a0e9",
        }));
        setEvents(mapped);
      } catch (err) {
        console.error("내 일정 불러오기 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, []);

  /** 날짜 클릭 → 모달 열기 */
  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr);
    setModalOpen(true);
  };

  /** 일정 생성 */
  const handleCreate = async (formData) => {
    try {
      const created = await createSchedule(formData);
      const newEvent = {
        id: created.id,
        title: created.title,
        start: toISO(created.startDateTime),
        end: toISO(created.endDateTime),
        backgroundColor: "#00a0e9",
        borderColor: "#00a0e9",
      };
      setEvents((prev) => [...prev, newEvent]);
      setModalOpen(false);
    } catch (err) {
      console.error("일정 생성 실패:", err);
    }
  };

  /** 로딩 중 화면 */
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
        initialView="dayGridMonth"
        height="auto"
        events={events}
        dateClick={handleDateClick}
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
          onSubmit={handleCreate}
        />
      )}
    </Box>
  );
}
