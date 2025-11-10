import React, { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { Box, Typography, CircularProgress, Stack, Button } from "@mui/material";
import { getMySchedules, createSchedule, updateSchedule, deleteSchedule } from "../api/scheduleAPI";
import { getParticipantsBySchedule } from "../api/scheduleParticipantAPI";
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
  const [participants, setParticipants] = useState([]);
  const calendarRef = useRef(null);
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [visibleEnd, setVisibleEnd] = useState(null);
  const { snack, showSnack, closeSnack } = useSnackbar();

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserEmail = storedUser?.email;

  console.log("✅ storedUser:", storedUser);
  console.log("✅ currentUserEmail:", currentUserEmail);

  /** 내 일정 조회 */
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        // [변경] accessToken 로딩/대기 로직 제거
        //  - 이제 http.js 응답 인터셉터가 /auth/refresh 를 통해 토큰을 자동 재발급해 주므로
        //    여기서는 단순히 API만 호출하면 됨.
        const data = await getMySchedules();

        const mapped = data.map((s) => ({
          id: s.id,
          title:
            s.visibility === "PRIVATE"
              ? `[비공개] ${s.title}`
              : s.title,
          start: toISO(s.startDateTime),
          end: toISO(s.endDateTime),
          content: s.content,
          location: s.location,
          visibility: s.visibility,
          userId: s.userId,
          userName: s.userName,
          userEmail: s.userEmail,
          categoryName: s.categoryName,
          meetingRoomName: s.meetingRoomName,
          // PRIVATE은 회색, PUBLIC은 파랑
          backgroundColor: s.visibility === "PRIVATE" ? "#999999" : "#00a0e9",
          borderColor: s.visibility === "PRIVATE" ? "#999999" : "#00a0e9",
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

  /** 일정 클릭 → 상세보기 모달 열기 */
  const handleEventClick = async (info) => {
  const clicked = events.find((e) => e.id === Number(info.event.id));
    if (!clicked) return;

    const isOwnerEmail = clicked.userEmail === currentUserEmail;

    // PUBLIC이면 무조건 접근 허용
    if (clicked.visibility !== "PRIVATE" || isOwnerEmail) {
      setDetailId(clicked.id);
      setDetailOpen(true);
      return;
    }

    try {
      const partData = await getParticipantsBySchedule(clicked.id);
      const normalized = Array.isArray(partData) ? partData : [partData];


      console.log("✅ participants:", normalized);
      console.log("✅ currentUserEmail:", currentUserEmail);


      const isAuthorized = normalized.some(
        (p) => p.userEmail && p.userEmail === currentUserEmail
      );

      console.log("✅ isAuthorized result:", isAuthorized);

      if (!isAuthorized) {
        showSnack("비공개 일정은 본인 또는 참석자만 볼 수 있습니다.", "warning");
        return;
      }

      setParticipants(normalized);
      setDetailId(clicked.id);
      setDetailOpen(true);
    } catch (err) {
        console.warn("참여자 조회 실패:", err);
        showSnack("일정 정보를 불러오는 중 오류가 발생했습니다.", "error");
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
                  title: updated.visibility === "PRIVATE" ? `[비공개] ${updated.title}` : updated.title,
                  start: toISO(updated.startDateTime),
                  end: toISO(updated.endDateTime),
                  content: updated.content,
                  location: updated.location,
                  visibility: updated.visibility,
                  userId: updated.userId,
                  userEmail: updated.userEmail,
                  userName: updated.userName,
                  backgroundColor:
                    updated.visibility === "PRIVATE" ? "#999999" : "#00a0e9",
                  borderColor:
                    updated.visibility === "PRIVATE" ? "#999999" : "#00a0e9",
                }
              : e
          )
        );
        showSnack("일정이 수정되었습니다", "success");
      } else {
        const created = await createSchedule(formData);
        const newEvent = {
          id: created.id,
          title: created.visibility === "PRIVATE" ? `[비공개] ${created.title}` : created.title,
          start: toISO(created.startDateTime),
          end: toISO(created.endDateTime),
          content: created.content,
          location: created.location,
          visibility: created.visibility,
          userId: created.userId,
          userEmail: created.userEmail,
          userName: created.userName,
          backgroundColor:
            created.visibility === "PRIVATE" ? "#999999" : "#00a0e9",
          borderColor:
            created.visibility === "PRIVATE" ? "#999999" : "#00a0e9",
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

  // FullCalendar가 현재 화면에 어떤 날짜 범위를 표시 중인지 콜백으로 전달
  // - list15days(목록 15일) 뷰 전환/prev/next/today 때마다 자동 호출
  const handleDatesSet = (info) => {
    setCurrentView(info.view.type); // (dayGridMonth | timeGridWeek | timeGridDay | list15days)
    setVisibleEnd(info.end);        // 표시 끝일(Date)  ※ list 뷰에서는 15일 경계
  };

  /** PRIVATE 일정 🔒 표시 */
  const renderEventContent = (arg) => {
    const event = arg.event.extendedProps;
    const isPrivate = event.visibility === "PRIVATE";

    const isOwner = event.userEmail === currentUserEmail;

    return (
      <div style={{ opacity: isPrivate ? 0.7 : 1 }}>
        {arg.timeText && (
          <span style={{ color: "#555", marginRight: 4 }}>{arg.timeText}</span>
        )}
        {isPrivate && <span>🔒 </span>}
        <b>{arg.event.title}</b>
        {isOwner && (
          <span style={{ fontSize: "0.8em", marginLeft: 4, color: "#333" }}>
            (내 일정)
          </span>
        )}
      </div>
    );
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
        ref={calendarRef} // 캘린더 API 제어를 위해 ref 바인딩
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth" // 기본은 월간
        headerToolbar={{
          left: "dayGridMonth,timeGridWeek,timeGridDay,list15days",
          center: "title",
          right: "prev,next today",
        }}
        buttonText={{
          today: "오늘",
          month: "월간",
          week: "주간",
          day: "일간",
          list15days: "목록",
        }}
        height="auto"
        events={events}
        eventContent={renderEventContent}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        datesSet={handleDatesSet} // 표시 범위 변경 시 호출되어 visibleStart/visibleEnd 갱신
        slotMinTime="08:00:00"
        slotMaxTime="21:00:00"
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        /** 커스텀 뷰 설정 (15일 단위 목록) */
        views={{ list15days: { type: "list", duration: { days: 15 }, buttonText: "목록" } }}
      />

      {/* 목록(15일) 뷰 전용 보조 UI: "~까지 표시 중" */}
      {currentView === "list15days" && visibleEnd && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {visibleEnd.toISOString().slice(0, 10)} 까지 표시 중
          </Typography>
        </Stack>
      )}

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
          currentUserEmail={currentUserEmail}
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
        <Alert onClose={closeSnack} severity={snack.severity} variant="filled" sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
