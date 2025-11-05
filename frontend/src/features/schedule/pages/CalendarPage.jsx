import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Box, Button, Typography } from "@mui/material";
import { getMySchedules, createSchedule } from "../api/scheduleAPI";
import ScheduleModal from "../components/ScheduleModal";

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // 초기 로드 시 일정 목록 불러오기
  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const data = await getMySchedules();
      const mapped = data.map(sch => ({
        id: sch.id,
        title: sch.title,
        start: sch.startDateTime,
        end: sch.endDateTime,
        backgroundColor: "#00a0e9",
        borderColor: "#00a0e9",
      }));
      setEvents(mapped);
    } catch (err) {
      console.error("일정 불러오기 실패:", err);
    }
  };

  // 날짜 클릭 → 새 일정 모달
  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr);
    setModalOpen(true);
  };

  // 일정 생성 완료 후 리프레시
  const handleCreate = async (newData) => {
    await createSchedule(newData);
    setModalOpen(false);
    await loadSchedules();
  };

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
