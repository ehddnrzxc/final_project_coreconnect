import React, { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { Box,
  Typography,
  CircularProgress,
  Stack
} from "@mui/material";
import { getMySchedules, createSchedule, updateSchedule, deleteSchedule } from "../api/scheduleAPI";
import { addParticipant, deleteParticipant, getParticipantsBySchedule } from "../api/scheduleParticipantAPI";
import { toISO } from "../../../utils/dateFormat";
import ScheduleCategoryPanel from "../components/ScheduleCategoryPanel";
import ScheduleModal from "../components/ScheduleModal";
import ScheduleDetailModal from "../components/ScheduleDetailModal";
import { useSnackbarContext } from "../../../components/utils/SnackbarContext";

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCategories, setActiveCategories] = useState([]);
  const [categoryColors, setCategoryColors] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const calendarRef = useRef(null);
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [visibleEnd, setVisibleEnd] = useState(null);
  const { showSnack } = useSnackbarContext();  // 전역 Snackbar 훅 사용
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserEmail = storedUser?.email;
  const [drawerOpen, setDrawerOpen] = useState(true);
  const toggleDrawer = () => {
    const updated = !drawerOpen;
    setDrawerOpen(updated);
    localStorage.setItem("drawerOpen", JSON.stringify(updated)); // 상태 변경 시 저장
  };


  // 일정 fetch 함수를 별도 정의
  const fetchSchedules = async (colors) => {
    try {
      const data = await getMySchedules();

      const mapped = data.map((s) => {
        const color =
          colors[s.categoryId] ||
          (s.visibility === "PRIVATE" ? "#999999" : "#00a0e9");

        return {
          id: s.id,
          title:
            s.visibility === "PRIVATE" ? `[비공개] ${s.title}` : s.title,
          start: toISO(s.startDateTime),
          end: toISO(s.endDateTime),
          content: s.content,
          location: s.location,
          visibility: s.visibility,
          categoryId: s.categoryId,
          userId: s.userId,
          userName: s.userName,
          userEmail: s.userEmail,
          categoryName: s.categoryName,
          meetingRoomName: s.meetingRoomName,
          backgroundColor: color,
          borderColor: color,
        };
      });

      setEvents(mapped);
    } catch {
      showSnack("일정 불러오기 실패", "error");
    } finally {
      setLoading(false);
    }
  };

  // localStorage 데이터 로드 후 fetchSchedules 실행
  useEffect(() => {
    const init = async () => {
      const savedDrawer = localStorage.getItem("drawerOpen");
      if (savedDrawer !== null) setDrawerOpen(JSON.parse(savedDrawer));

      const savedCategories = JSON.parse(localStorage.getItem("activeCategories") || "[]");
      const savedColors = JSON.parse(localStorage.getItem("categoryColors") || "{}");

      setActiveCategories(savedCategories);
      setCategoryColors(savedColors);

      // 색상 로드가 완료된 뒤 일정 로드 시작
      await fetchSchedules(savedColors);
    };

    init();
  }, []); // 로컬스토리지 로드 → 일정 로드 순서 보장


  /** 카테고리 선택 토글 */
  const handleToggleCategory = (id) => {
    setActiveCategories((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((cid) => cid !== id)
        : [...prev, id];
      localStorage.setItem("activeCategories", JSON.stringify(updated)); // 저장
      return updated;
    });
  };

  /** 색상 변경 함수: FullCalendar 즉시 반영 + localStorage 동기화 */
  const handleColorChange = (id, color) => {
    const updated = { ...categoryColors, [id]: color };
    setCategoryColors(updated);
    localStorage.setItem("categoryColors", JSON.stringify(updated));

    // FullCalendar 즉시 반영
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.getEvents().forEach((ev) => {
        if (ev.extendedProps.categoryId === id) {
          ev.setProp("backgroundColor", color);
          ev.setProp("borderColor", color);
        }
      });
    }

    showSnack("색상이 변경되었습니다.", "info"); // 스낵바 추가
  };

  /** 색상 변경 시에만 이벤트 갱신 (덮어쓰기 방지) */
  useEffect(() => {
    if (!calendarRef.current) return;
    const api = calendarRef.current.getApi();
    api.getEvents().forEach((ev) => {
      const catId = ev.extendedProps.categoryId;
      const color = categoryColors[catId];
      if (color) {
        ev.setProp("backgroundColor", color);
        ev.setProp("borderColor", color);
      }
    });
  }, [categoryColors]);

  /** 체크된 이벤트만 표시 */
  const filteredEvents = events.filter(
    (ev) => !ev.categoryId || activeCategories.includes(ev.categoryId)
  );

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
    const currentUserRole = JSON.parse(localStorage.getItem("user"))?.role;

    // 공개 일정은 누구나 접근 가능
    if (clicked.visibility !== "PRIVATE") {
      setDetailId(clicked.id);
      setDetailOpen(true);
      return;
    }

    // 관리자면 PRIVATE은 아예 상세 요청하지 않음 (참가자 API도 호출 X)
    if (currentUserRole === "ADMIN") {
      showSnack("비공개 일정은 관리자도 열람할 수 없습니다.", "info");
      return;
    }

    try {
      // PRIVATE 일정일 경우: 참가자 목록 조회
      const participants = await getParticipantsBySchedule(clicked.id);
      const isParticipant = participants.some(
        (p) => p.userEmail === currentUserEmail
      );

      if (isOwnerEmail || isParticipant) {
        setDetailId(clicked.id);
        setDetailOpen(true);
      } else {
        showSnack("비공개 일정은 본인 또는 참여자만 열람할 수 있습니다.", "warning");
      }
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
                  categoryId: updated.categoryId,          
                  categoryName: updated.categoryName,
                  meetingRoomName: updated.meetingRoomName,
                  meetingRoomId: updated.meetingRoomId,
                  backgroundColor:
                    categoryColors[updated.categoryId] ||
                    (updated.visibility === "PRIVATE" ? "#999999" : "#00a0e9"),
                  borderColor:
                    categoryColors[updated.categoryId] ||
                    (updated.visibility === "PRIVATE" ? "#999999" : "#00a0e9"),
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
          categoryId: created.categoryId,          
          categoryName: created.categoryName,
          meetingRoomName: created.meetingRoomName,
          meetingRoomId: created.meetingRoomId,
          backgroundColor:
            categoryColors[created.categoryId] ||
            (created.visibility === "PRIVATE" ? "#999999" : "#00a0e9"),
          borderColor:
            categoryColors[created.categoryId] ||
            (created.visibility === "PRIVATE" ? "#999999" : "#00a0e9"),
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
    <Box sx={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden" }}>
      {/* 카테고리 패널 표시 */}
      {drawerOpen && (
        <Box
          sx={{
            width: 260,
            flexShrink: 0,
            bgcolor: "white",
            borderRight: "1px solid #ddd",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ScheduleCategoryPanel
            activeCategories={activeCategories}
            onToggle={handleToggleCategory}
            onColorChange={handleColorChange}
            categoryColors={categoryColors}
          />
        </Box>
      )}

      {/* 캘린더 영역 */}
      <Box sx={{ flexGrow: 1, p: 3, overflowY: "auto" }}>
        <FullCalendar
          ref={calendarRef} // 캘린더 API 제어를 위해 ref 바인딩
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth" // 기본은 월간
          headerToolbar={{
            left: "toggleCategoryButton,dayGridMonth,timeGridWeek,timeGridDay,list15days",
            center: "title",
            right: "prev,next today",
          }}
          customButtons={{
            // 아이콘 버튼 추가
            toggleCategoryButton: {
              text: drawerOpen ? "✖" : "☰", // 기본 FullCalendar 스타일 유지 (텍스트 아이콘)
              click: toggleDrawer,
            },
          }}
          buttonText={{
            today: "오늘",
            month: "월간",
            week: "주간",
            day: "일간",
            list15days: "목록",
          }}
          height="auto"
          dayMaxEvents={3}          // 하루 최대 표시 일정 수 (넘으면 ‘+n개 더 보기’로 요약)
          moreLinkClick="popover"   // ‘+n개 더 보기’ 클릭 시 팝오버로 상세 일정 표시
          moreLinkContent={(arg) => ({
            html: `<span style="
                      color: rgba(0,0,0,0.6);
                      font-weight: 500;           
                      font-size: 0.9em;           
                      text-shadow: 0 0 2px rgba(0,0,0,0.1);
                      transition: all 0.2s ease;
                     "
                   >
                    +${arg.num}
                   </span>`,
          })}
          events={filteredEvents}
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

          eventDisplay="block"
          eventDidMount={(info) => {
            info.el.style.whiteSpace = "normal";
            info.el.style.overflow = "hidden";
            info.el.style.textOverflow = "ellipsis";
            info.el.style.wordBreak = "break-word";
            info.el.style.padding = "2px 4px";
            info.el.style.borderRadius = "4px";
          }}
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
      </Box>
    </Box>
  );
}
