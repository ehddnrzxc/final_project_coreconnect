import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, Stack, Tooltip } from "@mui/material";

/**
 * 참석자 일정표 (그룹웨어 스타일)
 * - 시간대: 08:00 ~ 17:00
 * - 1시간 단위 표시, 30분 블록 단위로 시각화
 */
export default function AttendeeTimelinePanel({
  users = [],
  availabilityMap = {},
  startDateTime,
  endDateTime,
}) {
  if (!startDateTime || !endDateTime) return null;

  // 30분 단위 구간 생성
  const timeSlots = useMemo(() => {
    const slots = [];
    const start = new Date(startDateTime.replace(" ", "T"));
    const end = new Date(endDateTime.replace(" ", "T"));
    for (let t = new Date(start); t < end; t.setMinutes(t.getMinutes() + 30)) {
      slots.push(`${t.getHours().toString().padStart(2, "0")}:${t
        .getMinutes()
        .toString()
        .padStart(2, "0")}`);
    }
    return slots;
  }, [startDateTime, endDateTime, users.length, Object.keys(availabilityMap).length]);

  // 특정 시간대에 일정이 있는지 여부
  const isBusy = (userId, time) => {
    const schedules = availabilityMap[userId] || [];

    // ISO(T포함) / LocalDateTime(공백) 모두 대응
    const dateBase = startDateTime.includes("T")
      ? startDateTime.split("T")[0]
      : startDateTime.split(" ")[0];

    const target = new Date(`${dateBase}T${time}:00`);

    return schedules.some((s) => {
      const sStart = new Date(s.startDateTime.replace(" ", "T"));
      const sEnd = new Date(s.endDateTime.replace(" ", "T"));
      return target >= sStart && target < sEnd;
    });
  };

  return (
    <Box
      sx={{
        width: 380,
        borderLeft: "1px solid #ddd",
        pl: 2,
        overflowX: "auto",
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        참석자 일정
      </Typography>

      {/* 상단 시간 라벨 */}
      <Stack direction="row" spacing={0.5} sx={{ mb: 1, ml: 8 }}>
        {timeSlots.map((time) => (
          <Typography
            key={time}
            variant="caption"
            sx={{ width: 36, textAlign: "center", color: "#666" }}
          >
            {time}
          </Typography>
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
            <Stack direction="row" spacing={0.5}>
              {timeSlots.map((time) => {
                const busy = isBusy(u.id, time);
                return (
                  <Tooltip
                    key={`${u.id}-${time}`}
                    title={
                      busy
                        ? availabilityMap[u.id]
                            ?.filter(
                              (s) =>
                                new Date(
                                  `${startDateTime.split(" ")[0]}T${time}:00`
                                ) >=
                                  new Date(
                                    s.startDateTime.replace(" ", "T")
                                  ) &&
                                new Date(
                                  `${startDateTime.split(" ")[0]}T${time}:00`
                                ) <
                                  new Date(s.endDateTime.replace(" ", "T"))
                            )
                            .map((s) => s.title)
                            .join(", ")
                        : "일정 없음"
                    }
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 20,
                        bgcolor: busy ? "#ef5350" : "#c8e6c9",
                        borderRadius: "3px",
                        transition: "background-color 0.2s ease",
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Stack>
          </Stack>
        ))}
      </Stack>

      <Typography
        variant="caption"
        sx={{ mt: 1, color: "#999", display: "block", textAlign: "right" }}
      >
        ※ 최대 50명의 참석자까지 표시됩니다.
      </Typography>
    </Box>
  );
}
