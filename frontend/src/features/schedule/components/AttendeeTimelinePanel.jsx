import React from "react";
import { Box, Typography, Stack, Tooltip } from "@mui/material";
import { toDate, toBackendFormat } from "../../../utils/dateFormat";

/**
 * 참석자 일정표 (그룹웨어 스타일)
 * - 0시~19시까지만 30분 블록 단위로 시각화 (00:00 ~ 19:59)
 * - 0~7시는 "0~"로 축약 표시, 8~19시는 각 시간대별 상세 표시
 * - 설정 시간은 파란색 테두리로 강조
 */
export default function AttendeeTimelinePanel({
  users = [],
  availabilityMap = {},
  startDateTime,
  endDateTime,
}) {
  if (!startDateTime || !endDateTime) return null;

  // 0시~19시까지만 30분 단위로 생성 (00:00 ~ 19:59)
  const allTimeSlots = (() => {
    const slots = [];
    const baseDate = toBackendFormat(startDateTime);
    if (!baseDate) return [];
    
    const dateBase = baseDate.split(" ")[0];
    if (!dateBase || !/^\d{4}-\d{2}-\d{2}$/.test(dateBase)) return [];
    
    // 하루의 시작 (00:00)
    const dayStart = toDate(`${dateBase}T00:00:00`);
    if (!dayStart || isNaN(dayStart.getTime())) return [];
    
    // 19:59까지 30분 단위로 생성 (20:00은 제외)
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(20, 0, 0, 0); // 20:00:00
    
    for (let t = new Date(dayStart); t < dayEnd; t.setMinutes(t.getMinutes() + 30)) {
      slots.push({
        time: `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}`,
        hour: t.getHours(),
        minute: t.getMinutes(),
        dateTime: new Date(t),
      });
    }
    return slots;
  })();

  // 시간대 그룹화: 0~7시는 "0~", 8~19시는 각 시간대별 (19~까지만 표시)
  const timeGroups = (() => {
    if (allTimeSlots.length === 0) return [];
    
    const groups = [];
    let currentGroup = null;
    
    allTimeSlots.forEach((slot) => {
      const hour = slot.hour;
      
      if (hour < 8) {
        // 0~7시: "0~" 그룹 (조그맣게 표시)
        if (!currentGroup || currentGroup.label !== "0~") {
          if (currentGroup) groups.push(currentGroup);
          currentGroup = {
            label: "0~",
            slots: [slot],
            width: 25, // 매우 작게 표시
          };
        } else {
          currentGroup.slots.push(slot);
        }
      } else if (hour >= 8 && hour < 20) {
        // 8~19시: 각 시간대별로 표시
        const hourLabel = hour.toString();
        if (!currentGroup || currentGroup.label !== hourLabel) {
          if (currentGroup) groups.push(currentGroup);
          currentGroup = {
            label: hourLabel,
            slots: [slot],
            width: 50, // 스크롤 없이 보이도록 조정
          };
        } else {
          currentGroup.slots.push(slot);
        }
      }
      // 19시 이후는 제외 (20시부터는 표시하지 않음)
    });
    
    if (currentGroup) groups.push(currentGroup);
    return groups;
  })();

  // 설정 시간 범위 계산
  const selectedTimeRange = (() => {
    if (!startDateTime || !endDateTime) return null;
    
    const normalizedStart = toBackendFormat(startDateTime);
    const normalizedEnd = toBackendFormat(endDateTime);
    
    if (!normalizedStart || !normalizedEnd) return null;
    
    const start = toDate(normalizedStart);
    const end = toDate(normalizedEnd);
    
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    
    return { start, end };
  })();

  // 특정 시간대에 일정이 있는지 여부
  const isBusy = (userId, slotDateTime) => {
    const schedules = availabilityMap[userId] || [];
    if (schedules.length === 0) return false;

    if (!slotDateTime || isNaN(slotDateTime.getTime())) return false;

    return schedules.some((s) => {
      if (!s.startDateTime || !s.endDateTime) return false;
      
      const sStart = toDate(s.startDateTime);
      const sEnd = toDate(s.endDateTime);
      
      if (!sStart || !sEnd || isNaN(sStart.getTime()) || isNaN(sEnd.getTime())) return false;
      
      return slotDateTime >= sStart && slotDateTime < sEnd;
    });
  };

  // 설정 시간 범위에 포함되는지 여부
  const isSelectedTime = (slotDateTime) => {
    if (!selectedTimeRange || !slotDateTime) return false;
    if (isNaN(slotDateTime.getTime())) return false;
    
    return slotDateTime >= selectedTimeRange.start && slotDateTime < selectedTimeRange.end;
  };

  // 전체 너비 계산: 0~ (25) + 8~19시 (12 * 50 = 600) = 625px
  // 참석자 이름 영역(70px) + 패딩(16px) 포함하여 전체 너비 설정
  const totalWidth = 25 + (12 * 50) + 70 + 16; // 약 711px

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: `${totalWidth}px`,
        borderLeft: "1px solid #ddd",
        pl: 2,
        pr: 2,
        overflowX: "hidden", // 스크롤 제거
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        참석자 일정
      </Typography>

      {/* 상단 시간 라벨 (시간대 그룹별) */}
      <Stack direction="row" spacing={0} sx={{ mb: 1, ml: 8 }}>
        {timeGroups.map((group, groupIndex) => (
          <Box
            key={groupIndex}
            sx={{
              width: group.width,
              display: "flex",
              justifyContent: "center",
              borderRight: "1px solid #e0e0e0",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                textAlign: "center",
                color: "#666",
                fontSize: "0.75rem",
              }}
            >
              {group.label}
            </Typography>
          </Box>
        ))}
      </Stack>

      {/* 참석자별 행 */}
      <Stack spacing={0.8}>
        {users.map((u) => (
          <Stack key={u.id} direction="row" alignItems="center">
            <Typography
              sx={{
                width: 70,
                textAlign: "right",
                pr: 1,
                fontSize: 13,
                color: "#444",
                whiteSpace: "nowrap",
              }}
            >
              {u.name}
            </Typography>
            <Stack direction="row" spacing={0}>
              {timeGroups.map((group, groupIndex) => (
                <Box
                  key={groupIndex}
                  sx={{
                    width: group.width,
                    display: "flex",
                    borderRight: "1px solid #e0e0e0",
                  }}
                >
                  {group.slots.map((slot, slotIndex) => {
                    const busy = isBusy(u.id, slot.dateTime);
                    const selected = isSelectedTime(slot.dateTime);
                    
                    // 0~ 그룹은 슬롯을 더 작게 표시
                    const isCompactGroup = group.label === "0~";
                    const slotWidth = isCompactGroup ? 2 : undefined; // 0~ 그룹은 2px로 매우 작게
                    
                    return (
                      <Tooltip
                        key={`${u.id}-${slot.time}-${slotIndex}`}
                        title={
                          busy
                            ? availabilityMap[u.id]
                                ?.filter((s) => {
                                  const sStart = toDate(s.startDateTime);
                                  const sEnd = toDate(s.endDateTime);
                                  if (!sStart || !sEnd || isNaN(sStart.getTime()) || isNaN(sEnd.getTime())) return false;
                                  return slot.dateTime >= sStart && slot.dateTime < sEnd;
                                })
                                .map((s) => s.title)
                                .join(", ")
                            : selected
                            ? "설정 시간"
                            : "일정 없음"
                        }
                      >
                        <Box
                          sx={{
                            flex: isCompactGroup ? 0 : 1,
                            width: slotWidth,
                            height: 20,
                            bgcolor: busy ? "#ef5350" : "#c8e6c9",
                            border: selected ? "2px solid #2196f3" : "none",
                            borderRadius: "3px",
                            transition: "background-color 0.2s ease",
                            minWidth: isCompactGroup ? "2px" : 0,
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </Box>
              ))}
            </Stack>
          </Stack>
        ))}
      </Stack>

      <Typography
        variant="caption"
        sx={{ mt: 1, color: "#999", display: "block", textAlign: "right" }}
      >
        ※ 참석자 수 제한 없이 모든 참석자의 일정을 표시합니다.
      </Typography>
    </Box>
  );
}
