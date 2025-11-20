import React, { useEffect, useState, useRef, useContext } from "react";
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
import { getParticipantsBySchedule } from "../api/scheduleParticipantAPI";
import { toISO, toLocalDate } from "../../../utils/dateFormat";
import ScheduleCategoryPanel from "../components/ScheduleCategoryPanel";
import ScheduleModal from "../components/ScheduleModal";
import ScheduleDetailModal from "../components/ScheduleDetailModal";
import { useSnackbarContext } from "../../../components/utils/SnackbarContext";
import { UserProfileContext } from "../../../App";
import "./CalendarPage.css";

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
  const [initialView] = useState(() => {
    try {
      const saved = localStorage.getItem("calendarView");
      const validViews = ["dayGridMonth", "timeGridWeek", "timeGridDay", "list15days"];
      if (saved && validViews.includes(saved)) {
        return saved;
      }
      return "dayGridMonth";
    } catch {
      return "dayGridMonth";
    }
  });
  const [initialDate] = useState(() => {
    try {
      const savedView = localStorage.getItem("calendarView");
      const validViews = ["dayGridMonth", "timeGridWeek", "timeGridDay", "list15days"];
      const view = savedView && validViews.includes(savedView) ? savedView : "dayGridMonth";
      
      let dateToUse = null;
      
      if (view === "timeGridWeek") {
        const weekDate = localStorage.getItem("weekViewDate");
        dateToUse = parseLocalStorageDate(weekDate) || new Date();
      } else if (view === "timeGridDay") {
        const dayDate = localStorage.getItem("dayViewDate");
        dateToUse = parseLocalStorageDate(dayDate) || new Date();
      } else if (view === "dayGridMonth") {
        const monthDate = localStorage.getItem("monthViewDate");
        if (monthDate) {
          const dayDate = localStorage.getItem("dayViewDate");
          const weekDate = localStorage.getItem("weekViewDate");
          const baseDate = dayDate || weekDate;
          if (baseDate) {
            const baseParsed = parseLocalStorageDate(baseDate);
            if (baseParsed) {
              const monthParsed = parseLocalStorageDate(monthDate, baseParsed.getDate());
              dateToUse = monthParsed || parseLocalStorageDate(monthDate, 1);
            } else {
              dateToUse = parseLocalStorageDate(monthDate, 1);
            }
          } else {
            dateToUse = parseLocalStorageDate(monthDate, 1);
          }
        }
        if (!dateToUse) {
          const dayDate = localStorage.getItem("dayViewDate");
          const weekDate = localStorage.getItem("weekViewDate");
          const baseDate = dayDate || weekDate;
          if (baseDate) {
            const baseParsed = parseLocalStorageDate(baseDate);
            dateToUse = baseParsed ? new Date(baseParsed.getFullYear(), baseParsed.getMonth(), 1) : new Date();
          } else {
            dateToUse = new Date();
          }
        }
      } else if (view === "list15days") {
        const listDate = localStorage.getItem("listViewDate");
        dateToUse = parseLocalStorageDate(listDate);
        if (!dateToUse) {
          const dayDate = localStorage.getItem("dayViewDate");
          const weekDate = localStorage.getItem("weekViewDate");
          const baseDate = dayDate || weekDate;
          if (baseDate) {
            const baseParsed = parseLocalStorageDate(baseDate);
            dateToUse = baseParsed ? new Date(baseParsed.getFullYear(), baseParsed.getMonth(), 1) : new Date();
          } else {
            dateToUse = new Date();
          }
        }
      }
      
      return dateToUse || undefined;
    } catch {
      return undefined;
    }
  });
  const [visibleEnd, setVisibleEnd] = useState(null);
  const { showSnack } = useSnackbarContext();  // 전역 Snackbar 훅 사용
  const { userProfile } = useContext(UserProfileContext) || {};
  const currentUserEmail = userProfile?.email;
  const [drawerOpen, setDrawerOpen] = useState(true);
  const toggleDrawer = () => {
    const updated = !drawerOpen;
    setDrawerOpen(updated);
    localStorage.setItem("drawerOpen", JSON.stringify(updated)); // 상태 변경 시 저장
  };


  // localStorage 날짜 파싱 헬퍼 함수
  const parseLocalStorageDate = (dateStr, defaultDay = null) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-').map(Number);
    if (parts.length < 2) return null;
    const [year, month, day] = parts;
    // day가 undefined이면 defaultDay 사용, 그것도 없으면 1 사용
    const dayToUse = day !== undefined ? day : (defaultDay !== null ? defaultDay : 1);
    const date = new Date(year, month - 1, dayToUse);
    return !isNaN(date.getTime()) ? date : null;
  };

  /**
   * 하루 종일 일정인지 판단하는 헬퍼 함수
   * 
   * 종일 일정 판단 기준:
   * - 같은 날짜에 시작하고 끝나는 경우
   * - 시작 시간이 00:00:00이고 종료 시간이 23:59:00 이상 (또는 다음날 00:00:00)
   * - 또는 duration이 23시간 59분 이상
   * 
   * 참고: 백엔드에서 종일 일정 플래그를 제공하지 않으므로 프론트엔드에서 판단
   * 종일 일정의 종료 시간은 "23:59:59"로 설정됨 (ScheduleModal에서 처리)
   * 
   * @param {string} startDateTime - 시작 날짜/시간 (백엔드 형식: "yyyy-MM-dd HH:mm:ss")
   * @param {string} endDateTime - 종료 날짜/시간 (백엔드 형식: "yyyy-MM-dd HH:mm:ss")
   * @returns {boolean} 종일 일정 여부
   */
  const isFullDayEvent = (startDateTime, endDateTime) => {
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);
    const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;
    const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
    
    // 같은 날짜에 시작하고 끝나는 경우
    const isSameDay = startDateStr === endDateStr;
    if (!isSameDay) return false;
    
    const startHour = startDate.getHours();
    const startMinute = startDate.getMinutes();
    const endHour = endDate.getHours();
    const endMinute = endDate.getMinutes();
    const duration = endDate.getTime() - startDate.getTime();
    
    // 하루 종일 일정 판단: 정확히 00:00부터 23:59까지 또는 다음날 00:00까지
    // 1. 시작이 00:00:00이고 종료가 23:59:00 이상이거나 다음날 00:00:00
    // 2. duration이 23시간 59분 이상 (거의 하루 종일)
    const isFullDay = 
      startHour === 0 && 
      startMinute === 0 && 
      ((endHour === 23 && endMinute >= 59) || // 23:59 이상
       (endHour >= 24) || // 다음날 00:00 (24시 이상)
       (duration >= 23 * 60 * 60 * 1000 + 59 * 60 * 1000)); // 23시간 59분 이상
    
    return isFullDay;
  };

  // 서버 데이터를 FullCalendar 이벤트 형식으로 변환하는 공통 함수
  const mapScheduleToEvent = (schedule, colors) => {
    const color = colors[schedule.categoryId] || (schedule.visibility === "PRIVATE" ? "#999999" : "#90A4AE");
    const startDateStr = toLocalDate(schedule.startDateTime);
    const endDateStr = toLocalDate(schedule.endDateTime);
    const isMultiDay = startDateStr !== endDateStr;
    const isAllDayEvent = isFullDayEvent(schedule.startDateTime, schedule.endDateTime) || isMultiDay;
    
    let eventStart = toISO(schedule.startDateTime);
    let eventEnd = toISO(schedule.endDateTime);
    
    if (isAllDayEvent) {
      eventStart = startDateStr;
      const endDateObj = new Date(schedule.endDateTime);
      endDateObj.setDate(endDateObj.getDate() + 1);
      eventEnd = toLocalDate(endDateObj);
    }
    
    return {
      id: String(schedule.id),
      title: schedule.visibility === "PRIVATE" ? `${schedule.title}` : schedule.title,
      start: eventStart,
      end: eventEnd,
      allDay: isAllDayEvent,
      content: schedule.content,
      location: schedule.location,
      visibility: schedule.visibility,
      categoryId: schedule.categoryId,
      userId: schedule.userId,
      userName: schedule.userName,
      userEmail: schedule.userEmail,
      categoryName: schedule.categoryName,
      meetingRoomName: schedule.meetingRoomName,
      meetingRoomId: schedule.meetingRoomId,
      dotColor: color,
      originalStartDateTime: schedule.startDateTime,
      originalEndDateTime: schedule.endDateTime,
    };
  };

  // 일정 fetch 함수를 별도 정의
  const fetchSchedules = async (colors) => {
    try {
      const data = await getMySchedules();
      const mapped = data.map((s) => mapScheduleToEvent(s, colors));
      setEvents(mapped);
    } catch {
      showSnack("일정 불러오기 실패", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      const currentView = api.view.type;
      prevViewRef.current = currentView;
    }
  }, [initialView]);
  
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
  }, []);


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

    // 일정 배열 자체에 dotColor 업데이트
    setEvents(prev =>
      prev.map(e =>
        e.categoryId === id ? { ...e, dotColor: color } : e
      )
    );
  };

  /** 색상 변경 시에만 이벤트 갱신 (덮어쓰기 방지) */
  useEffect(() => {
    if (!calendarRef.current) return;
    const api = calendarRef.current.getApi();
    api.getEvents().forEach((ev) => {
      const catId = ev.extendedProps.categoryId;
      const color = categoryColors[catId];
      if (color) {
        ev.setExtendedProp("dotColor", color);
      }
    });
  }, [categoryColors]);

  /** 체크된 이벤트만 표시 */
  const filteredEvents = events.filter(
    (ev) => !ev.categoryId || activeCategories.includes(ev.categoryId)
  );

  /** 날짜 클릭 → 새 일정 등록 */
  const handleDateClick = (info) => {
    // timeGrid 뷰에서는 info.date에 시간 정보가 포함되어 있음
    // info.dateStr은 날짜만 포함하므로, Date 객체를 직접 전달
    setSelectedDate(info.date instanceof Date ? info.date : info.dateStr);
    setSelectedEvent(null);
    setModalOpen(true);
  };

  /** 일정 클릭 → 상세보기 모달 열기 */
  const handleEventClick = async (info) => {
    // 팝오버 즉시 제거 (모달 열기 전에)
    document
      .querySelectorAll(".fc-popover, .fc-more-popover")
      .forEach((el) => el.remove());
    
    try {
      info.jsEvent.stopPropagation();
      info.jsEvent.preventDefault(); // FullCalendar의 기본 동작(팝오버 유지 등) 차단 

      // 이벤트 ID를 문자열로 변환하여 비교 (FullCalendar는 ID를 문자열로 저장할 수 있음)
      const eventId = String(info.event.id);
      const clicked = events.find((e) => String(e.id) === eventId);
      
      if (!clicked) {
        return;
      }

      const isOwnerEmail = clicked.userEmail === currentUserEmail;
      const currentUserRole = userProfile?.role;

      // 공개 일정은 누구나 접근 가능
      if (clicked.visibility !== "PRIVATE") {
        // React 렌더링 중 상태 업데이트를 방지하기 위해 setTimeout 사용
        setTimeout(() => {
          // 모달 열기 직전에 팝오버 재제거 (FullCalendar가 재생성했을 수 있음)
          document
            .querySelectorAll(".fc-popover, .fc-more-popover")
            .forEach((el) => el.remove());
          
          setDetailId(clicked.id);
          setDetailOpen(true);
        }, 0);
        return;
      }

      // 관리자면 PRIVATE은 아예 상세 요청하지 않음 (참가자 API도 호출 X)
      if (currentUserRole === "ADMIN") {
        showSnack("비공개 일정은 관리자도 열람할 수 없습니다.", "info");
        return;
      }

      // PRIVATE 일정일 경우: 참가자 목록 조회
      const participants = await getParticipantsBySchedule(clicked.id);
      const isParticipant = participants.some(
        (p) => p.userEmail === currentUserEmail
      );

      if (isOwnerEmail || isParticipant) {
        // React 렌더링 중 상태 업데이트를 방지하기 위해 setTimeout 사용
        setTimeout(() => {
          // 모달 열기 직전에 팝오버 재제거 (FullCalendar가 재생성했을 수 있음)
          document
            .querySelectorAll(".fc-popover, .fc-more-popover")
            .forEach((el) => el.remove());
          
          setDetailId(clicked.id);
          setDetailOpen(true);
        }, 0);
      } else {
        showSnack("비공개 일정은 본인 또는 참여자만 열람할 수 있습니다.", "warning");
      }
    } catch (err) {
      showSnack("일정 정보를 불러오는 중 오류가 발생했습니다.", "error");
    }
  };


  /** 일정 등록 or 수정 */
  const handleSubmit = async (formData, isEdit) => {
    try {
      if (isEdit && selectedEvent) {
        const updated = await updateSchedule(selectedEvent.id, formData);
        const updatedEvent = mapScheduleToEvent(updated, categoryColors);
        
        setEvents((prev) =>
          prev.map((e) => {
            // ID 타입 불일치 문제 해결: String 변환으로 비교
            if (String(e.id) === String(selectedEvent.id)) {
              return updatedEvent;
            }
            return e;
          })
        );
        showSnack("일정이 수정되었습니다", "success");
      } else {
        const created = await createSchedule(formData);
        const newEvent = mapScheduleToEvent(created, categoryColors);
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
      setEvents((prev) => prev.filter((e) => String(e.id) !== String(id)));
      showSnack("일정이 삭제되었습니다", "info");
      setModalOpen(false);
      setDetailOpen(false);
    } catch (err) {
      showSnack(err.message || "삭제 실패", "error");
    }
  };

  const prevViewRef = useRef(null);
  
  const handleDatesSet = (info) => {
    try {
      const newView = info.view.type;
      const validViews = ["dayGridMonth", "timeGridWeek", "timeGridDay", "list15days"];
      if (validViews.includes(newView)) {
        const prevView = prevViewRef.current;
        prevViewRef.current = newView;
        
        if (calendarRef.current) {
          const api = calendarRef.current.getApi();
          const currentDate = api.getDate();
          
          if (currentDate instanceof Date && !isNaN(currentDate.getTime())) {
            if (newView === "timeGridWeek") {
              if (prevView !== "dayGridMonth") {
                const weekStart = info.view.currentStart;
                if (weekStart instanceof Date && !isNaN(weekStart.getTime())) {
                  localStorage.setItem("weekViewDate", toLocalDate(weekStart));
                }
              }
            } else if (newView === "timeGridDay") {
              if (prevView !== "dayGridMonth") {
                const dateStr = toLocalDate(currentDate);
                if (dateStr) {
                  localStorage.setItem("dayViewDate", dateStr);
                }
              }
            } else if (newView === "dayGridMonth") {
              const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
              localStorage.setItem("monthViewDate", toLocalDate(monthStart));
            } else if (newView === "list15days") {
              const monthDate = localStorage.getItem("monthViewDate");
              let listStart = null;
              
              if (monthDate) {
                const [year, month] = monthDate.split('-').map(Number);
                listStart = new Date(year, month - 1, 1);
              } else {
                const dayDate = localStorage.getItem("dayViewDate");
                const weekDate = localStorage.getItem("weekViewDate");
                const baseDate = dayDate || weekDate;
                if (baseDate) {
                  const [year, month] = baseDate.split('-').map(Number);
                  listStart = new Date(year, month - 1, 1);
                } else {
                  listStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                }
              }
              
              if (listStart) {
                localStorage.setItem("listViewDate", toLocalDate(listStart));
              }
            }
          }
        }
        
        localStorage.setItem("calendarView", newView);
      }
      
      setVisibleEnd(info.end);
    } catch (err) {
      if (info && info.end) {
        setVisibleEnd(info.end);
      }
    }
  };

  // 카테고리 색상을 rgba로 변환하는 헬퍼 함수 (컴포넌트 레벨로 이동)
  const hexToRgba = (hex, alpha = 0.15) => {
    // hex가 undefined이거나 유효하지 않을 때 기본값 사용
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
      hex = "#90A4AE"; // 기본 색상
    }
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  /** 일정 표시 */
  const renderEventContent = (arg) => {
    const event = arg.event.extendedProps;
    const isPrivate = event.visibility === "PRIVATE";
    const color = event.dotColor || (isPrivate ? "#999999" : "#90A4AE");  

    const isTimeView = arg.view.type === "timeGridWeek" || arg.view.type === "timeGridDay";
    
    // multi-day event인지 확인 (원래 시작/종료 날짜로 판단)
    const originalStart = event.originalStartDateTime ? new Date(event.originalStartDateTime) : null;
    const originalEnd = event.originalEndDateTime ? new Date(event.originalEndDateTime) : null;
    const originalStartDate = originalStart ? toLocalDate(originalStart) : null;
    const originalEndDate = originalEnd ? toLocalDate(originalEnd) : null;
    const isMultiDay = originalStartDate && originalEndDate && originalStartDate !== originalEndDate; 

    const privateStyle = isPrivate ? { opacity: 0.55 } : {};
    
    // 시간 포맷팅 헬퍼
    const formatTime = (date) => {
      if (!date) return "";
      const d = date instanceof Date ? date : new Date(date);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    };

    // 모든 뷰용 Hover 스타일 적용 함수
    const handleEnter = (e) => {
      // 카테고리 색상을 더 진하게 표시
      e.currentTarget.style.backgroundColor = hexToRgba(color, 0.25);
    };
    const handleLeave = (e) => {
      // 원래 배경색으로 복원
      e.currentTarget.style.backgroundColor = hexToRgba(color, 0.15);
    };

    // 모든 뷰에서 공통으로 사용할 시간 표시 포맷팅 함수
    const getTimeDisplayText = () => {
      // 원래 시간이 없으면 기존 방식 사용
      if (!originalStart || !originalEnd) {
        return arg.timeText;
      }
      
      // 하루 이내 일정: "시작시간 ~ 종료시간" 형식으로 표시
      if (!isMultiDay) {
        return `${formatTime(originalStart)} ~ ${formatTime(originalEnd)}`;
      }

      // FullCalendar는 multi-day event를 날짜별로 분할합니다.
      // arg.isStart와 arg.isEnd 속성을 우선 사용합니다.
      
      // 시작일 판단: arg.isStart가 true인 경우
      if (arg.isStart) {
        return `${formatTime(originalStart)} ~`;
      }
      
      // 종료일 판단: arg.isEnd가 true인 경우
      if (arg.isEnd) {
        return `~ ${formatTime(originalEnd)}`;
      }
      
      // 중간 날짜는 시간 표시 없음
      return "";
    };

    // 공통 변수 선언 (중복 제거)
    const timeDisplayText = getTimeDisplayText();
    const shouldShowBorder = !isMultiDay || arg.isStart;

    // 공통 JSX 컴포넌트 함수
    const renderEventBox = (isTimeView = false) => (
      <div
        onMouseEnter={handleEnter}   
        onMouseLeave={handleLeave}  
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "4px",
          ...(isTimeView && { height: "100%", minHeight: "100%" }),
          borderLeft: shouldShowBorder ? `4px solid ${color}` : "none", 
          backgroundColor: hexToRgba(color, 0.15),
          paddingLeft: 6,
          paddingTop: 4,
          paddingBottom: 4,
          borderRadius: 4,
          boxSizing: "border-box",
          fontSize: "0.95em",
          lineHeight: "1.4",
          ...(isTimeView ? {} : privateStyle), // 주간/일간: div에 없음, 월간/목록: div에 적용 (span은 모든 뷰에서 적용)
        }}
      >
        {/* 시간 + 제목을 세로로 배치 */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", width: "100%", minWidth: 0 }}>
          {timeDisplayText && (
            <span style={{ flexShrink: 0, color: "#555", fontSize: "0.85em", lineHeight: "1.4" }}>
              {timeDisplayText}
            </span>
          )}
          <span
            style={{
              fontWeight: 600,
              color: "#000",
              fontSize: "0.95em",
              lineHeight: "1.4",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              ...privateStyle, // 모든 뷰에서 span에 적용
            }}
          >
            {isPrivate && "🔒 "}
            {arg.event.title}
          </span>
        </div>
      </div>
    );

    // 주간/일간 뷰
    if (isTimeView) {
      return renderEventBox(true);
    }

    // 월간/목록 뷰
    return renderEventBox(false);
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
          fixedWeekCount={true}
          locale="ko"
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={initialView}
          initialDate={initialDate}

          viewDidMount={() => {
            // 왼쪽 축(시간 라벨) 너비 강제 확대
            document.querySelectorAll(".fc-timegrid-axis").forEach((el) => {
              el.style.width = "120px";
              el.style.minWidth = "120px";
              el.style.maxWidth = "120px";
            });

            // colgroup 축도 강제 스타일 적용
            document.querySelectorAll("col.fc-scrollgrid-shrink").forEach((el) => {
              el.style.width = "120px";
            });
          }}
          
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
          allDayText="종일일정"
          height="auto"
          dayMaxEvents={3}          // 하루 최대 표시 일정 수 (넘으면 ‘+n개 더 보기’로 요약)
          moreLinkClick={(arg) => {
            // popover 강제 제거
            setTimeout(() => {
              document
                .querySelectorAll(".fc-popover, .fc-more-popover")
                .forEach((el) => el.remove());
            }, 0);

            return "popover"; //‘+n개 더 보기’ 클릭 시 팝오버로 상세 일정 표시
          }}   
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
          datesSet={(info) => {
            const prevView = prevViewRef.current;
            handleDatesSet(info);
            
            const currentView = info.view.type;
            const api = calendarRef.current?.getApi();
            if (!api) return;
            
            const currentDate = api.getDate();
            if (!(currentDate instanceof Date) || isNaN(currentDate.getTime())) return;
            
            const isViewChanged = prevView !== currentView;
            
            if (currentView === "timeGridWeek") {
              if (isViewChanged) {
                const monthDate = localStorage.getItem("monthViewDate");
                const savedWeekDate = localStorage.getItem("weekViewDate");
                
                if (monthDate && savedWeekDate) {
                  const monthParsed = parseLocalStorageDate(monthDate);
                  const savedWeekParsed = parseLocalStorageDate(savedWeekDate);
                  if (monthParsed && savedWeekParsed) {
                    const targetDate = new Date(monthParsed.getFullYear(), monthParsed.getMonth(), savedWeekParsed.getDate());
                    const targetWeekStart = new Date(targetDate);
                    targetWeekStart.setDate(targetWeekStart.getDate() - targetWeekStart.getDay() + 1);
                    const currentWeekStart = info.view.currentStart;
                    if (currentWeekStart && toLocalDate(currentWeekStart) !== toLocalDate(targetWeekStart)) {
                      api.gotoDate(targetWeekStart);
                      const adjustedWeekStart = new Date(targetWeekStart);
                      if (adjustedWeekStart instanceof Date && !isNaN(adjustedWeekStart.getTime())) {
                        localStorage.setItem("weekViewDate", toLocalDate(adjustedWeekStart));
                      }
                      return;
                    }
                  }
                } else if (savedWeekDate) {
                  const savedDate = parseLocalStorageDate(savedWeekDate);
                  if (savedDate) {
                    const currentWeekStart = info.view.currentStart;
                    if (currentWeekStart && toLocalDate(currentWeekStart) !== toLocalDate(savedDate)) {
                      api.gotoDate(savedDate);
                      return;
                    }
                  }
                }
              } else {
                const weekStart = info.view.currentStart;
                if (weekStart instanceof Date && !isNaN(weekStart.getTime())) {
                  localStorage.setItem("weekViewDate", toLocalDate(weekStart));
                }
              }
            } else if (currentView === "timeGridDay") {
              if (isViewChanged) {
                const monthDate = localStorage.getItem("monthViewDate");
                const savedDayDate = localStorage.getItem("dayViewDate");
                
                if (monthDate && savedDayDate) {
                  const monthParsed = parseLocalStorageDate(monthDate);
                  const savedDayParsed = parseLocalStorageDate(savedDayDate);
                  if (monthParsed && savedDayParsed) {
                    const targetDate = new Date(monthParsed.getFullYear(), monthParsed.getMonth(), savedDayParsed.getDate());
                    const targetDateStr = toLocalDate(targetDate);
                    const currentDateStr = toLocalDate(currentDate);
                    if (targetDateStr && targetDateStr !== currentDateStr) {
                      api.gotoDate(targetDate);
                      const adjustedDate = api.getDate();
                      if (adjustedDate instanceof Date && !isNaN(adjustedDate.getTime())) {
                        const adjustedDateStr = toLocalDate(adjustedDate);
                        if (adjustedDateStr) {
                          localStorage.setItem("dayViewDate", adjustedDateStr);
                        }
                      }
                      return;
                    }
                  }
                } else if (savedDayDate) {
                  const savedDate = parseLocalStorageDate(savedDayDate);
                  if (savedDate) {
                    const currentDateStr = toLocalDate(currentDate);
                    const savedDateStr = toLocalDate(savedDate);
                    if (currentDateStr !== savedDateStr) {
                      api.gotoDate(savedDate);
                      return;
                    }
                  }
                }
              } else {
                const dateStr = toLocalDate(currentDate);
                if (dateStr) {
                  localStorage.setItem("dayViewDate", dateStr);
                }
              }
            } else if (currentView === "dayGridMonth") {
              if (isViewChanged) {
                const monthDate = localStorage.getItem("monthViewDate");
                const dayDate = localStorage.getItem("dayViewDate");
                const weekDate = localStorage.getItem("weekViewDate");
                
                if (monthDate) {
                  const savedMonth = parseLocalStorageDate(monthDate, 1);
                  if (savedMonth) {
                    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                    if (toLocalDate(currentMonth) !== toLocalDate(savedMonth)) {
                      if (dayDate || weekDate) {
                        const baseDate = dayDate || weekDate;
                        const baseParsed = parseLocalStorageDate(baseDate);
                        if (baseParsed) {
                          const targetDate = new Date(savedMonth.getFullYear(), savedMonth.getMonth(), baseParsed.getDate());
                          api.gotoDate(targetDate);
                          return;
                        }
                      } else {
                        api.gotoDate(savedMonth);
                        return;
                      }
                    }
                  }
                } else if (dayDate || weekDate) {
                  const baseDate = dayDate || weekDate;
                  const baseParsed = parseLocalStorageDate(baseDate);
                  if (baseParsed) {
                    const targetDate = new Date(new Date().getFullYear(), new Date().getMonth(), baseParsed.getDate());
                    api.gotoDate(targetDate);
                    return;
                  }
                }
              }
            } else if (currentView === "list15days") {
              if (isViewChanged) {
                const monthDate = localStorage.getItem("monthViewDate");
                let targetListStart = null;
                
                if (monthDate) {
                  targetListStart = parseLocalStorageDate(monthDate, 1);
                } else {
                  const listDate = localStorage.getItem("listViewDate");
                  if (listDate) {
                    const listParsed = parseLocalStorageDate(listDate);
                    targetListStart = listParsed ? new Date(listParsed.getFullYear(), listParsed.getMonth(), 1) : null;
                  } else {
                    const dayDate = localStorage.getItem("dayViewDate");
                    const weekDate = localStorage.getItem("weekViewDate");
                    if (dayDate || weekDate) {
                      const baseDate = dayDate || weekDate;
                      const baseParsed = parseLocalStorageDate(baseDate);
                      targetListStart = baseParsed ? new Date(baseParsed.getFullYear(), baseParsed.getMonth(), 1) : null;
                    }
                  }
                }
                
                if (targetListStart) {
                  const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                  const targetMonth = new Date(targetListStart.getFullYear(), targetListStart.getMonth(), 1);
                  if (toLocalDate(currentMonth) !== toLocalDate(targetMonth)) {
                    api.gotoDate(targetListStart);
                    return;
                  }
                }
              }
            }
          }}
          eventOrder={(event1, event2) => {
            // originalStartDateTime 우선 사용 (멀티데이/allDay 이벤트의 실제 시작 시간 반영)
            const getStartTime = (event) => {
              const original = event.extendedProps?.originalStartDateTime;
              if (original) {
                const date = new Date(original);
                return isNaN(date.getTime()) ? 0 : date.getTime();
              }
              // originalStartDateTime이 없으면 start 사용
              if (event.start) {
                const date = typeof event.start === 'string' 
                  ? new Date(event.start) 
                  : event.start;
                return isNaN(date.getTime()) ? 0 : date.getTime();
              }
              return 0;
            };
            
            const time1 = getStartTime(event1);
            const time2 = getStartTime(event2);
            
            // 시작 시간이 같으면 제목으로 정렬 (선택사항)
            if (time1 === time2) {
              return (event1.title || '').localeCompare(event2.title || '');
            }
            
            return time1 - time2; // 오름차순 (시간이 빠른 것부터)
          }}
          slotMinTime="08:00:00"
          slotMaxTime="21:00:00"
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          /** 커스텀 뷰 설정 (15일 단위 목록) */
          views={{ list15days: { type: "list", duration: { days: 15 }, buttonText: "목록" } }}

          eventDisplay="block"
          eventDidMount={(info) => {
            const view = info.view.type;
            const isTimeView = view === "timeGridWeek" || view === "timeGridDay";
            
            info.el.style.border = "none";
            info.el.style.backgroundColor = "transparent";
            info.el.style.background = "transparent";
            
            // 주간/일간 뷰일 때
            if (isTimeView) {
              // renderEventContent에서 설정한 배경색은 유지하고, FullCalendar 기본 요소만 투명 처리
              const eventMain = info.el.querySelector(".fc-event-main");
              if (eventMain) {
                // .fc-event-main은 renderEventContent의 div를 감싸는 요소이므로 투명 유지
                eventMain.style.backgroundColor = "transparent";
                eventMain.style.background = "transparent";
              }

              // 주간/일간 뷰에서는 높이가 시간에 맞게 자동 조정되도록
              info.el.style.height = "100%";
              info.el.style.minHeight = "100%";
            } else {
              // 주간/일간 뷰가 아닐 때만 텍스트 줄바꿈 방지
              info.el.style.whiteSpace = "nowrap";
              info.el.style.overflow = "hidden";
              info.el.style.textOverflow = "ellipsis";
            }
          }}
        />

        {/* 목록(15일) 뷰 전용 보조 UI: "~까지 표시 중" */} 
        {initialView === "list15days" && visibleEnd && (
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
