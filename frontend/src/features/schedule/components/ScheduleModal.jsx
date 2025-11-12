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
} from "@mui/material";
import { toBackendFormat, toISO } from "../../../utils/dateFormat";
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

  const [meetingRooms, setMeetingRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [roomAvailable, setRoomAvailable] = useState(true);
  const [availabilityMap, setAvailabilityMap] = useState({});

  const [form, setForm] = useState({
    title: "",
    content: "",
    location: "",
    startDateTime: date ? `${date} 09:00:00` : "",
    endDateTime: date ? `${date} 10:00:00` : "",
    meetingRoomId: "",
    categoryId: "1",
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

  /**  수정 모드라면 기존 값 채우기 */
  useEffect(() => {
    if (isEdit && initialData) {
      setForm({
        title: initialData.title || "",
        content: initialData.content || "",
        location: initialData.location || "",
        startDateTime: toISO(initialData.startDateTime),
        endDateTime: toISO(initialData.endDateTime),
        meetingRoomId: initialData.meetingRoomId || "",
        categoryId: initialData.categoryId || "",
        participantIds: initialData.participantIds || [],
        visibility: initialData.visibility || "PUBLIC",
      });
    }
  }, [initialData]);

  /** 수정 모드 전용: initialData 세팅 후 참석자 일정 현황 즉시 재조회 */
  useEffect(() => {
    if (
      isEdit &&
      form.participantIds.length > 0 &&
      form.startDateTime &&
      form.endDateTime
    ) {
      (async () => {
        try {
          const availability = await getUsersAvailability(
            form.participantIds,
            toBackendFormat(form.startDateTime),
            toBackendFormat(form.endDateTime)
          );
          setAvailabilityMap({ ...availability });
        } catch (err) {
          showSnack("참석자 일정 현황을 불러오는 중 오류가 발생했습니다.", "error");
        }
      })();
    }
  }, [isEdit, form.participantIds, form.startDateTime, form.endDateTime]);


  /** 참석자 일정 현황 조회 */
  useEffect(() => {
    const checkParticipantsAvailability = async () => {
      if (form.participantIds.length === 0 || !form.startDateTime || !form.endDateTime) return;

      try {
        const availability = await getUsersAvailability(
          form.participantIds,
          toBackendFormat(form.startDateTime), // "yyyy-MM-dd HH:mm:ss"
          toBackendFormat(form.endDateTime)
        );
        setAvailabilityMap({ ...availability });
      } catch (err) {
        showSnack("참석자 일정 현황을 불러오는 중 오류가 발생했습니다.", "error");
      }
    };
    checkParticipantsAvailability();
  }, [form.participantIds, form.startDateTime, form.endDateTime, showSnack]);


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
      if (!form.meetingRoomId || !form.startDateTime || !form.endDateTime) return;
      const result = await checkRoomAvailable(
        form.meetingRoomId,
        form.startDateTime,
        form.endDateTime
      );
      setRoomAvailable(result.available);
    };
    checkAvailability();
  }, [form.meetingRoomId, form.startDateTime, form.endDateTime]);

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
    if (!roomAvailable) {
      showSnack("이 시간대에는 선택한 회의실이 이미 예약되어 있습니다.", "warning");
      return;
    }
    const payload = {
      ...form,
      startDateTime: toBackendFormat(form.startDateTime),
      endDateTime: toBackendFormat(form.endDateTime),
    };
    onSubmit(payload, isEdit);
  };

  // 오른쪽 패널에 넘길 '선택된 사용자 목록'
  const selectedUsers = useMemo(
    () => users.filter((u) => form.participantIds.includes(u.id)),
    [users, form.participantIds]
  );

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
            <TextField label="제목" name="title" value={form.title} onChange={handleChange} fullWidth />
            <TextField label="내용" name="content" value={form.content} onChange={handleChange} fullWidth />
            <TextField label="장소" name="location" value={form.location} onChange={handleChange} fullWidth />

            {/* 공개 여부 선택: PUBLIC / PRIVATE */}
            <FormControl fullWidth>
              <InputLabel id="visibility-label">공개 여부</InputLabel>
              <Select
                labelId="visibility-label"
                label="공개 여부"
                name="visibility"
                value={form.visibility}
                onChange={handleChange}
              >
                <MenuItem value="PUBLIC">공개</MenuItem>
                <MenuItem value="PRIVATE">비공개</MenuItem>
              </Select>
            </FormControl>

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
              value={users.filter((u) => form.participantIds.includes(u.id))}
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

            {/* 시간 선택 */}
            <TextField
              label="시작 시간"
              name="startDateTime"
              type="datetime-local"
              value={form.startDateTime ? form.startDateTime.replace(" ", "T") : ""}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="종료 시간"
              name="endDateTime"
              type="datetime-local"
              value={form.endDateTime ? form.endDateTime.replace(" ", "T") : ""}
              onChange={handleChange}
              fullWidth
            />

            {/* 회의실 */}
            <FormControl fullWidth>
              <InputLabel id="meetingRoom-label">회의실</InputLabel>
              <Select
                labelId="meetingRoom-label"
                name="meetingRoomId"
                value={form.meetingRoomId}
                label="회의실"
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

            {!roomAvailable && (
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
