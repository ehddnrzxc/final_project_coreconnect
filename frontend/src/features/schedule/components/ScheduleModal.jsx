import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Stack,
  Autocomplete,
  Alert,
  useMediaQuery,
  useTheme,
  FormControl,      
  InputLabel,      
  Select,          
  Chip, 
  Box,
  Typography,
  RadioGroup,
  Radio,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { toBackendFormat, toISO, toDateTimeLocal, fromDateTimeLocal } from "../../../utils/dateFormat";
import {
  getMeetingRooms,
  getScheduleCategories,
  getUsers,
  checkRoomAvailable,
  getAvailableMeetingRooms,
  getUsersAvailability 
} from "../api/scheduleAPI";
import AttendeeTimelinePanel from "../components/AttendeeTimelinePanel";
import { useSnackbarContext } from "../../../components/utils/SnackbarContext";

export default function ScheduleModal({
  open,
  onClose,
  date,
  onSubmit,
  onDelete,
  initialData,
}) {
  const isEdit = !!initialData;
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm")); // 모바일일 때 전체화면 처리
  const { showSnack } = useSnackbarContext();

  // 종일 일정 판단 함수
  const isAllDayEvent = (startDateTime, endDateTime) => {
    if (!startDateTime || !endDateTime) return false;
    
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    
    const startDateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
    const endDateStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
    
    const isMultiDay = startDateStr !== endDateStr;
    const isSameDay = startDateStr === endDateStr;
    
    if (isMultiDay) {
      // 멀티데이: 시작일 00:00, 종료일 23:59이면 종일
      const startTime = start.getHours() === 0 && start.getMinutes() === 0;
      const endTime = end.getHours() === 23 && end.getMinutes() === 59;
      return startTime && endTime;
    }
    
    if (isSameDay) {
      // 하루 종일: 00:00 ~ 23:59
      return start.getHours() === 0 && 
             start.getMinutes() === 0 && 
             end.getHours() === 23 && 
             end.getMinutes() === 59;
    }
    
    return false;
  };

  const [meetingRooms, setMeetingRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [roomAvailable, setRoomAvailable] = useState(true);
  const [availabilityMap, setAvailabilityMap] = useState({});

  const [form, setForm] = useState({
    title: "",
    content: "",
    location: "",
    // 통합 필드 (기존 호환성 유지)
    startDateTime: date ? `${date} 09:00:00` : "",
    endDateTime: date ? `${date} 10:00:00` : "",
    // 분리 필드 (UI용)
    startDate: date || "",
    startTime: "09:00",
    endDate: date || "",
    endTime: "10:00",
    // 시간/분 분리 필드 (UI용)
    startTimeHour: "9",
    startTimeMinute: "0",
    endTimeHour: "10",
    endTimeMinute: "0",
    // 종일 일정 여부
    isAllDay: false,
    meetingRoomId: "",
    categoryId: "",
    participantIds: [],
    visibility: "PUBLIC", 
  });

  /** 공통 데이터 로드 */
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const [roomsRes, catsRes, usersRes] = await Promise.allSettled([
        getMeetingRooms(),
        getScheduleCategories(),
        getUsers(),
      ]);
      if (roomsRes.status === "fulfilled") setMeetingRooms(roomsRes.value);
      if (catsRes.status === "fulfilled") setCategories(catsRes.value);
      if (usersRes.status === "fulfilled") setUsers(usersRes.value);
    };
    load();
  }, [open]);

  /** 모달이 열릴 때 초기화 및 수정 모드일 때 기존 값 채우기 */
  useEffect(() => {
    if (!open) {
      // 모달이 닫히면 form 초기화
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      setForm({
        title: "",
        content: "",
        location: "",
        startDateTime: date ? `${date} 09:00:00` : `${todayStr} 09:00:00`,
        endDateTime: date ? `${date} 10:00:00` : `${todayStr} 10:00:00`,
        startDate: date || todayStr,
        startTime: "09:00",
        endDate: date || todayStr,
        endTime: "10:00",
        startTimeHour: "9",
        startTimeMinute: "0",
        endTimeHour: "10",
        endTimeMinute: "0",
        isAllDay: false,
        meetingRoomId: "",
        categoryId: "",
        participantIds: [],
        visibility: "PUBLIC",
      });
      return;
    }

    // 수정 모드라면 기존 값 채우기
    if (isEdit && initialData) {
      const startISO = toISO(initialData.startDateTime);
      const endISO = toISO(initialData.endDateTime);
      
      // 통합 필드 → 분리 필드 변환
      const startParts = startISO ? startISO.split('T') : ['', ''];
      const endParts = endISO ? endISO.split('T') : ['', ''];
      
      // 종일 여부 판단
      const isAllDay = isAllDayEvent(initialData.startDateTime, initialData.endDateTime);
      
      // 시간/분 분리
      const startTimeParts = startParts[1] ? startParts[1].substring(0, 5).split(':') : ['09', '00'];
      const endTimeParts = endParts[1] ? endParts[1].substring(0, 5).split(':') : ['10', '00'];
      
      setForm({
        title: initialData.title || "",
        content: initialData.content || "",
        location: initialData.location || "",
        startDateTime: startISO ? startISO.replace('T', ' ') : "",
        endDateTime: endISO ? endISO.replace('T', ' ') : "",
        startDate: startParts[0] || "",
        startTime: startParts[1] ? startParts[1].substring(0, 5) : "09:00",
        endDate: endParts[0] || "",
        endTime: endParts[1] ? endParts[1].substring(0, 5) : "10:00",
        startTimeHour: isAllDay ? "0" : (startTimeParts[0] || "9"),
        startTimeMinute: isAllDay ? "0" : (startTimeParts[1] || "0"),
        endTimeHour: isAllDay ? "23" : (endTimeParts[0] || "10"),
        endTimeMinute: isAllDay ? "59" : (endTimeParts[1] || "0"),
        isAllDay: isAllDay,
        meetingRoomId: initialData.meetingRoomId || "",
        categoryId: initialData.categoryId || "",
        participantIds: initialData.participantIds || [],
        visibility: initialData.visibility || "PUBLIC",
      });
    } else if (date) {
      // 새 일정 등록 모드이고 date가 있으면 초기값 설정
      setForm((prev) => ({
        ...prev,
        startDateTime: `${date} 09:00:00`,
        endDateTime: `${date} 10:00:00`,
        startDate: date,
        startTime: "09:00",
        endDate: date,
        endTime: "10:00",
        startTimeHour: "9",
        startTimeMinute: "0",
        endTimeHour: "10",
        endTimeMinute: "0",
        isAllDay: false,
      }));
    } else {
      // date가 없을 때 오늘 날짜로 기본값 설정
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      setForm((prev) => ({
        ...prev,
        startDateTime: `${todayStr} 09:00:00`,
        endDateTime: `${todayStr} 10:00:00`,
        startDate: todayStr,
        startTime: "09:00",
        endDate: todayStr,
        endTime: "10:00",
        startTimeHour: "9",
        startTimeMinute: "0",
        endTimeHour: "10",
        endTimeMinute: "0",
        isAllDay: false,
      }));
    }
  }, [open, initialData, isEdit, date]);

  /** 분리 필드 → 통합 필드 자동 동기화 (시작) */
  useEffect(() => {
    if (form.startDate && form.startTime) {
      const combined = `${form.startDate} ${form.startTime}:00`;
      setForm((prev) => {
        // 무한 루프 방지: 값이 같으면 업데이트하지 않음
        if (prev.startDateTime === combined) return prev;
        return { ...prev, startDateTime: combined };
      });
    }
  }, [form.startDate, form.startTime]);

  /** 분리 필드 → 통합 필드 자동 동기화 (종료) */
  useEffect(() => {
    if (form.endDate && form.endTime) {
      const combined = `${form.endDate} ${form.endTime}:00`;
      setForm((prev) => {
        // 무한 루프 방지: 값이 같으면 업데이트하지 않음
        if (prev.endDateTime === combined) return prev;
        return { ...prev, endDateTime: combined };
      });
    }
  }, [form.endDate, form.endTime]);

  /** 시간/분 분리 필드 → 통합 필드 자동 동기화 (시작) */
  useEffect(() => {
    if (form.startTimeHour !== undefined && form.startTimeMinute !== undefined) {
      const combined = `${String(form.startTimeHour).padStart(2, '0')}:${String(form.startTimeMinute).padStart(2, '0')}`;
      setForm((prev) => {
        // 무한 루프 방지: 값이 같으면 업데이트하지 않음
        if (prev.startTime === combined) return prev;
        return { ...prev, startTime: combined };
      });
    }
  }, [form.startTimeHour, form.startTimeMinute]);

  /** 시간/분 분리 필드 → 통합 필드 자동 동기화 (종료) */
  useEffect(() => {
    if (form.endTimeHour !== undefined && form.endTimeMinute !== undefined) {
      const combined = `${String(form.endTimeHour).padStart(2, '0')}:${String(form.endTimeMinute).padStart(2, '0')}`;
      setForm((prev) => {
        // 무한 루프 방지: 값이 같으면 업데이트하지 않음
        if (prev.endTime === combined) return prev;
        return { ...prev, endTime: combined };
      });
    }
  }, [form.endTimeHour, form.endTimeMinute]);

  /** 참석자 일정 현황 조회 */
  useEffect(() => {
    if (form.participantIds.length === 0 || !form.startDateTime || !form.endDateTime) return;

    const checkParticipantsAvailability = async () => {
      try {
        const availability = await getUsersAvailability(
          form.participantIds,
          toBackendFormat(form.startDateTime),
          toBackendFormat(form.endDateTime)
        );
        setAvailabilityMap({ ...availability });
        
        // 종일 일정일 때 추가 정보 표시
        if (form.isAllDay && Object.values(availability).some(arr => arr && arr.length > 0)) {
          // 정보는 한 번만 표시하도록 플래그 사용 (선택사항)
        }
      } catch (err) {
        showSnack("참석자 일정 현황을 불러오는 중 오류가 발생했습니다.", "error");
      }
    };
    checkParticipantsAvailability();
  }, [form.participantIds, form.startDateTime, form.endDateTime, form.isAllDay, showSnack]);

  /** 회의실 선택 시 시간대 기반으로 가용성 조회 */
  const handleRoomSelectOpen = async () => {
    if (!form.startDateTime || !form.endDateTime) {
      showSnack("먼저 시작 시간과 종료 시간을 입력하세요.", "warning");
      return;
    }

    try {
      const start = toBackendFormat(form.startDateTime);
      const end = toBackendFormat(form.endDateTime);
      const availableRooms = await getAvailableMeetingRooms(start, end);

      setMeetingRooms((prev) =>
        prev.map((room) => {
          const isAvailable = availableRooms.some((r) => r.id === room.id);
          return { ...room, availableYn: isAvailable };
        })
      );
      showSnack("현재 시간대 기준으로 사용 가능한 회의실들을 불러왔습니다.", "info");
    } catch (err) {
      showSnack("회의실 정보를 불러오는 중 오류가 발생했습니다.", "error");
    }
  };

  /** 회의실 예약 가능 여부 검사 */
  useEffect(() => {
    const checkAvailability = async () => {
      // 종일 일정은 회의실 예약 검사 건너뛰기
      if (form.isAllDay) {
        setRoomAvailable(true); // 검사는 통과하지만 경고는 UI에서 표시
        return;
      }
      
      if (!form.meetingRoomId || !form.startDateTime || !form.endDateTime) return;
      const result = await checkRoomAvailable(
        form.meetingRoomId,
        form.startDateTime,
        form.endDateTime
      );
      setRoomAvailable(result.available);
    };
    checkAvailability();
  }, [form.meetingRoomId, form.startDateTime, form.endDateTime, form.isAllDay]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /** 참석자별 상태 계산 함수 */
  const getParticipantStatus = (userId) => {
    const schedules = availabilityMap[userId];
    return Array.isArray(schedules) && schedules.length > 0 ? "busy" : "free";
  };

  const handleSubmit = () => {
    if (!roomAvailable && !form.isAllDay) {
      // 종일이 아닐 때만 회의실 예약 가능 여부 검사
      showSnack("이 시간대에는 선택한 회의실이 이미 예약되어 있습니다.", "warning");
      return;
    }
    
    // 종일이면 시간을 00:00:00, 23:59:00으로 설정
    const startDateTime = form.isAllDay
      ? `${form.startDate} 00:00:00`
      : `${form.startDate} ${form.startTime}:00`;
      
    const endDateTime = form.isAllDay
      ? `${form.endDate} 23:59:00`
      : `${form.endDate} ${form.endTime}:00`;
    
    // scheduleAPI.js에서 toBackendFormat을 처리하므로 여기서는 그대로 전달
    // 분리 필드(UI용)는 제외하고 전송
    const { 
      startDate, 
      startTime, 
      endDate, 
      endTime, 
      startTimeHour, 
      startTimeMinute, 
      endTimeHour, 
      endTimeMinute,
      isAllDay,
      ...payload 
    } = form;
    
    onSubmit({
      ...payload,
      startDateTime,
      endDateTime
    }, isEdit);
  };

  // 오른쪽 패널에 넘길 '선택된 사용자 목록'
  const selectedUsers = useMemo(
    () => users.filter((u) => form.participantIds.includes(u.id)),
    [users, form.participantIds]
  );

  // 시간 옵션 (0~23시)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // 분 옵션 (5분 단위: 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55)
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  // 종료 시간 옵션 생성 (동적 필터링)
  const endTimeHours = useMemo(() => {
    const isSameDay = form.startDate === form.endDate;
    
    if (isSameDay) {
      // 같은 날짜: 시작 시간 이후만 허용
      const startHour = Number(form.startTimeHour || 9);
      return hours.filter(h => h > startHour);
    }
    // 다른 날짜: 모든 시간 허용
    return hours;
  }, [form.startDate, form.endDate, form.startTimeHour]);

  const endTimeMinutes = useMemo(() => {
    const isSameDay = form.startDate === form.endDate;
    
    if (isSameDay) {
      // 같은 날짜: 시작 시간과 같은 시간이면 시작 분 이후만 허용
      const startHour = Number(form.startTimeHour || 9);
      const endHour = Number(form.endTimeHour || 10);
      const startMinute = Number(form.startTimeMinute || 0);
      
      if (endHour === startHour) {
        // 같은 시간이면 시작 분 이후만 허용
        return minutes.filter(m => m > startMinute);
      }
    }
    // 다른 날짜이거나 다른 시간이면 모든 분 허용
    return minutes;
  }, [form.startDate, form.endDate, form.startTimeHour, form.startTimeMinute, form.endTimeHour]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="lg"
      fullWidth
      scroll="paper" // 내부 스크롤 자동 처리
      slotProps={{
        sx: {
          borderRadius: 2,
          p: 0,
        },
      }}
    >
      {/* 제목 영역 */}
      <DialogTitle sx={{ fontWeight: 600, borderBottom: "1px solid #ddd" }}>
        {isEdit ? "일정 수정" : "일정 등록"}
      </DialogTitle>

      {/* 내용 영역 (자동 스크롤) */}
      <DialogContent dividers sx={{p: 0, display: "flex", flexDirection: "row", height: "calc(100vh - 160px)",  overflow: "hidden"}}>
        <Box sx={{ flex: 1, p: 3, overflowY: "auto", minWidth: 600}}>
          <Stack spacing={2}>
            {/* 제목 + 종일 라디오 버튼 + 비공개 체크박스 */}
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField 
                label="제목" 
                name="title" 
                value={form.title} 
                onChange={handleChange} 
                sx={{ flex: 1 }}
              />
              <FormControl>
                <RadioGroup
                  row
                  value={form.isAllDay ? "allDay" : "time"}
                  onChange={(e) => {
                    const isAllDay = e.target.value === "allDay";
                    
                    setForm(prev => {
                      if (isAllDay) {
                        // 종일 선택: 00:00 ~ 23:59로 설정
                        return {
                          ...prev,
                          isAllDay: true,
                          startTimeHour: "0",
                          startTimeMinute: "0",
                          endTimeHour: "23",
                          endTimeMinute: "59",
                          startTime: "00:00",
                          endTime: "23:59",
                          // 통합 필드도 업데이트
                          startDateTime: `${prev.startDate} 00:00:00`,
                          endDateTime: `${prev.endDate} 23:59:00`,
                          // 종일 일정은 회의실 예약 불가
                          meetingRoomId: ""
                        };
                      } else {
                        // 시간 지정 선택
                        return {
                          ...prev,
                          isAllDay: false,
                          // 기존 값이 없으면 기본값
                          startTimeHour: prev.startTimeHour || "9",
                          startTimeMinute: prev.startTimeMinute || "0",
                          endTimeHour: prev.endTimeHour || "10",
                          endTimeMinute: prev.endTimeMinute || "0",
                          startTime: prev.startTime || "09:00",
                          endTime: prev.endTime || "10:00"
                        };
                      }
                    });
                  }}
                >
                  <FormControlLabel value="time" control={<Radio />} label="시간 지정" />
                  <FormControlLabel value="allDay" control={<Radio />} label="종일" />
                </RadioGroup>
              </FormControl>
              {/* 비공개 체크박스 */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.visibility === "PRIVATE"}
                    onChange={(e) => {
                      setForm(prev => ({
                        ...prev,
                        visibility: e.target.checked ? "PRIVATE" : "PUBLIC"
                      }));
                    }}
                  />
                }
                label="비공개"
              />
            </Stack>
            <TextField label="내용" name="content" value={form.content} onChange={handleChange} fullWidth />
            <TextField label="장소" name="location" value={form.location} onChange={handleChange} fullWidth />

            {/* 카테고리 */}
            <TextField
              select
              label="카테고리"
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              fullWidth
            >
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </TextField>

            {/* 참석자 선택 + 상태 표시 */}
            <Autocomplete
              multiple
              options={users}
              getOptionLabel={(option) => `${option.name} (${option.email})`}
              value={selectedUsers}
              onChange={(e, selected) =>
                setForm((prev) => ({
                  ...prev,
                  participantIds: selected.map((s) => s.id),
                }))
              }
              renderTags={(selected, getTagProps) =>
                selected.map((option, index) => {
                  const status = getParticipantStatus(option.id);
                  return (
                    <Chip
                      key={option.id}
                      label={`${option.name} ${status === "busy" ? "🟥 바쁨" : "🟩 가능"}`}
                      color={status === "busy" ? "error" : "success"}
                      {...getTagProps({ index })}
                    />
                  );
                })
              }
              renderInput={(params) => (
                <TextField {...params} label="참여자 초대" placeholder="검색 후 선택" />
              )}
            />

            {/* 참석자 중 일정 겹치는 사람 있을 때 경고 */}
            {Object.values(availabilityMap).some((arr) => arr && arr.length > 0) && (
              <Alert severity="warning">
                일부 참석자는 이미 해당 날짜에 다른 일정이 있습니다.
              </Alert>
            )}

            {/* 날짜 및 시간 선택 (분리된 필드) */}
            <Stack direction="row" spacing={2} alignItems="center">
              {/* 시작 날짜 */}
              <TextField
                label="시작 날짜"
                type="date"
                value={form.startDate}
                onChange={(e) => {
                  const selected = e.target.value;
                  setForm((prev) => {
                    // 종료 날짜가 시작 날짜보다 이전이면 자동 조정
                    const newEndDate = prev.endDate && selected > prev.endDate ? selected : prev.endDate;
                    const isSameDay = selected === newEndDate;
                    
                    return {
                      ...prev,
                      startDate: selected,
                      endDate: newEndDate,
                      // 종일이면 시간은 유지 (00:00, 23:59)
                      // 시간 지정이면 날짜가 같아지면 종료 시간을 시작 시간 + 1시간으로 자동 조정
                      endTime: prev.isAllDay
                        ? prev.endTime  // 종일이면 유지
                        : (isSameDay && prev.startTimeHour !== undefined
                          ? (() => {
                              const hour = Number(prev.startTimeHour || 9);
                              const minute = prev.startTimeMinute || "0";
                              const nextHour = (hour + 1) % 24;
                              return `${String(nextHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                            })()
                          : prev.endTime), // 다른 날짜가 되면 기존 종료 시간 유지
                      // 분리 필드도 함께 업데이트
                      endTimeHour: prev.isAllDay
                        ? prev.endTimeHour  // 종일이면 유지
                        : (isSameDay && prev.startTimeHour !== undefined
                          ? String((Number(prev.startTimeHour || 9) + 1) % 24)
                          : prev.endTimeHour),
                      endTimeMinute: prev.isAllDay
                        ? prev.endTimeMinute  // 종일이면 유지
                        : (isSameDay && prev.startTimeMinute !== undefined
                          ? prev.startTimeMinute
                          : prev.endTimeMinute),
                      // 통합 필드 업데이트
                      startDateTime: prev.isAllDay
                        ? `${selected} 00:00:00`
                        : `${selected} ${prev.startTime}:00`
                    };
                  });
                }}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1 }}
              />
              {/* 시작 시간 (종일이 아닐 때만 표시) */}
              {!form.isAllDay && (
                <Stack direction="row" spacing={1}>
                  <FormControl sx={{ minWidth: 80 }}>
                    <InputLabel>시</InputLabel>
                    <Select
                      value={form.startTimeHour || "9"}
                      onChange={(e) => {
                        const hour = e.target.value;
                        const minute = form.startTimeMinute || "0";
                        // 통합 필드 업데이트
                        const combined = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                        // 종료 시간도 자동 업데이트
                        const nextHour = (Number(hour) + 1) % 24;
                        const nextTime = `${String(nextHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                        
                        setForm(prev => ({
                          ...prev,
                          startTimeHour: hour,
                          startTime: combined,
                          endTimeHour: String(nextHour),
                          endTime: nextTime
                        }));
                      }}
                      label="시"
                    >
                      {hours.map(h => (
                        <MenuItem key={h} value={h}>{h}시</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl sx={{ minWidth: 80 }}>
                    <InputLabel>분</InputLabel>
                    <Select
                      value={form.startTimeMinute || "0"}
                      onChange={(e) => {
                        const minute = e.target.value;
                        const hour = form.startTimeHour || "9";
                        // 통합 필드 업데이트
                        const combined = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                        // 종료 시간도 자동 업데이트
                        const nextHour = (Number(hour) + 1) % 24;
                        const nextTime = `${String(nextHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                        
                        setForm(prev => ({
                          ...prev,
                          startTimeMinute: minute,
                          startTime: combined,
                          endTimeHour: String(nextHour),
                          endTime: nextTime
                        }));
                      }}
                      label="분"
                    >
                      {minutes.map(m => (
                        <MenuItem key={m} value={m}>{m}분</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              )}
              {/* 구분선 */}
              <Typography sx={{ mt: 2 }}>-</Typography>
              {/* 종료 날짜 */}
              <TextField
                label="종료 날짜"
                type="date"
                value={form.endDate}
                onChange={(e) => {
                  const selected = e.target.value;
                  // 시작 날짜보다 이전이면 경고
                  if (form.startDate && selected < form.startDate) {
                    showSnack("종료 날짜는 시작 날짜 이후여야 합니다.", "warning");
                    return;
                  }
                  
                  setForm((prev) => {
                    const isSameDay = prev.startDate === selected;
                    
                    return {
                      ...prev,
                      endDate: selected,
                      // 종일이면 시간은 유지 (00:00, 23:59)
                      // 시간 지정이면 날짜가 같아지면 종료 시간을 시작 시간 + 1시간으로 자동 조정
                      endTime: prev.isAllDay
                        ? prev.endTime  // 종일이면 유지
                        : (isSameDay && prev.startTimeHour !== undefined
                          ? (() => {
                              const hour = Number(prev.startTimeHour || 9);
                              const minute = prev.startTimeMinute || "0";
                              const nextHour = (hour + 1) % 24;
                              return `${String(nextHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                            })()
                          : prev.endTime), // 다른 날짜가 되면 기존 종료 시간 유지
                      // 분리 필드도 함께 업데이트
                      endTimeHour: prev.isAllDay
                        ? prev.endTimeHour  // 종일이면 유지
                        : (isSameDay && prev.startTimeHour !== undefined
                          ? String((Number(prev.startTimeHour || 9) + 1) % 24)
                          : prev.endTimeHour),
                      endTimeMinute: prev.isAllDay
                        ? prev.endTimeMinute  // 종일이면 유지
                        : (isSameDay && prev.startTimeMinute !== undefined
                          ? prev.startTimeMinute
                          : prev.endTimeMinute),
                      // 통합 필드 업데이트
                      endDateTime: prev.isAllDay
                        ? `${selected} 23:59:00`
                        : `${selected} ${prev.endTime}:00`
                    };
                  });
                }}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: {
                    min: form.startDate || undefined, // 시작 날짜 이전 선택 불가
                  },
                }}
                sx={{ flex: 1 }}
              />
              {/* 종료 시간 (종일이 아닐 때만 표시) */}
              {!form.isAllDay && (
                <Stack direction="row" spacing={1}>
                  <FormControl sx={{ minWidth: 80 }}>
                    <InputLabel>시</InputLabel>
                    <Select
                      value={form.endTimeHour || "10"}
                      onChange={(e) => {
                        const hour = e.target.value;
                        const minute = form.endTimeMinute || "0";
                        const combined = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                        setForm(prev => ({
                          ...prev,
                          endTimeHour: hour,
                          endTime: combined
                        }));
                      }}
                      label="시"
                    >
                      {endTimeHours.map(h => (
                        <MenuItem key={h} value={h}>{h}시</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl sx={{ minWidth: 80 }}>
                    <InputLabel>분</InputLabel>
                    <Select
                      value={form.endTimeMinute || "0"}
                      onChange={(e) => {
                        const minute = e.target.value;
                        const hour = form.endTimeHour || "10";
                        const combined = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                        setForm(prev => ({
                          ...prev,
                          endTimeMinute: minute,
                          endTime: combined
                        }));
                      }}
                      label="분"
                    >
                      {endTimeMinutes.map(m => (
                        <MenuItem key={m} value={m}>{m}분</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              )}
            </Stack>

            {/* 회의실 */}
            <FormControl fullWidth>
              <InputLabel id="meetingRoom-label">회의실</InputLabel>
              <Select
                labelId="meetingRoom-label"
                name="meetingRoomId"
                value={form.meetingRoomId}
                label="회의실"
                disabled={form.isAllDay}  // 종일일 때 비활성화
                onOpen={handleRoomSelectOpen}   // 드롭다운이 열릴 때 바로 실행됨
                onChange={handleChange}
              >
                {meetingRooms.map((room) => (
                  <MenuItem key={room.id} value={room.id} disabled={!room.availableYn}>
                    {room.name} {room.availableYn ? "" : "(예약 불가)"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {form.isAllDay && (
              <Alert severity="info">
                종일 일정은 회의실 예약을 사용할 수 없습니다.
              </Alert>
            )}

            {!roomAvailable && !form.isAllDay && (
              <Alert severity="warning">
                선택한 시간에는 해당 회의실이 이미 예약되어 있습니다.
              </Alert>
            )}
          </Stack>
        </Box>

        {/* 오른쪽 참석자 일정표 */}
        <Box sx={{width: 450, borderLeft: "1px solid #ddd", overflowY: "auto", overflowX: "auto", backgroundColor: "#fafafa"}}>
          <AttendeeTimelinePanel
            users={selectedUsers}
            availabilityMap={availabilityMap}
            startDateTime={form.startDateTime}
            endDateTime={form.endDateTime}
          />
        </Box>
      </DialogContent>

      {/* 하단 버튼 (항상 고정) */}
      <DialogActions sx={{ borderTop: "1px solid #ddd", p: 2 }}>
        {isEdit && (
          <Button color="error" onClick={() => onDelete(initialData.id)}>
            삭제
          </Button>
        )}
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {isEdit ? "수정" : "등록"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
