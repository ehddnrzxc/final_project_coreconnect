import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRecentViewedBoards } from "../api/boardAPI";
import { Box, Typography, Paper, List, ListItemButton, ListItemText, Divider } from "@mui/material";
import { useSnackbarContext } from "../../../components/utils/SnackbarContext";


const RecentViewedBoards = () => {
  const [boards, setBoards] = useState([]); // 최근 본 게시글 목록을 저장할 상태 변수
  const navigate = useNavigate(); // 특정 게시글 상세 페이지로 이동하기 위한 훅
  const { showSnack } = useSnackbarContext(); // 에러 발생 시 사용자 알림

  // 컴포넌트가 처음 렌더링될 때 실행
  useEffect(() => {
    // 비동기 즉시실행 함수(async IIFE): 최근 게시글 목록을 서버에서 가져옴
    (async () => {
      try {
        const res = await getRecentViewedBoards(); // 최근 본 게시글 API 호출
        setBoards(res.data.data || []); // 응답 데이터가 존재하면 boards 상태에 저장, 없으면 빈 배열
      } catch (err) {
        showSnack("최근 본 게시글을 불러오는 중 오류가 발생했습니다.", "error"); // 사용자 알림
      }
    })();
  }, []); // 의존성 배열이 비어있으므로 최초 1회만 실행됨 (마운트 시점)

  // 날짜 포맷 변환 함수: ISO 문자열 → 한국 시간대의 짧은 날짜/시간 형식
  const formatDate = (dateStr) => {
    const d = new Date(dateStr); // 문자열을 Date 객체로 변환
    return d.toLocaleString("ko-KR", {
      dateStyle: "short", // "yy. MM. dd" 형식
      timeStyle: "short", // "HH:mm" 형식
    });
  };

  // 화면 렌더링
  return (
    <Box sx={{ width: "100%", mt: 4, textAlign: "center" }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        🔍 최근 본 게시글
      </Typography>

      {boards.length === 0 ? (
        <Typography color="text.secondary">최근 본 게시글이 없습니다.</Typography>
      ) : (
        <Paper
          variant="outlined"
          sx={{
            p: 2,                         // ★ 수정: 패딩 확장
            width: "85%",                // ★ 수정: 박스 폭 넓힘
            mx: "auto",
            borderRadius: 3,             // ★ 수정: 부드러운 모서리
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)", // ★ 수정: 가벼운 그림자
          }}
        >
          <List>
            {boards.map((b, idx) => (
              <React.Fragment key={b.id}>

                <ListItemButton
                  onClick={() => navigate(`/board/detail/${b.id}`)}
                  sx={{
                    py: 1.5,                       // ★ 수정: 리스트 항목 상하 공간 증가
                    borderRadius: 2,               // ★ 수정: 항목 각각도 둥글게
                    transition: "0.15s",           // ★ 추가: 부드러운 hover 애니메이션
                    "&:hover": {
                      bgcolor: "#f2f8ff",          // ★ 수정: 은은한 파란 hover
                      transform: "translateX(4px)" // ★ 추가: 살짝 오른쪽으로 이동
                    }
                  }}
                >

                  {/* ★ 기존 Avatar 제거 → 모던 아이콘으로 교체 */}
                  <span
                    style={{
                      fontSize: "22px",
                      marginRight: "14px",
                      opacity: 0.9,
                    }}
                  >
                    📄
                  </span>

                  <ListItemText
                    primary={b.title}
                    primaryTypographyProps={{
                      sx: {
                        fontWeight: 600,           // ★ 수정: 제목 Bold 강화
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      },
                    }}
                    secondary={`${b.writerName}${b.writerJobGrade ? ` ${b.writerJobGrade}` : ""} · ${formatDate(
                      b.createdAt
                    )} · 조회수 ${b.viewCount}`}
                    secondaryTypographyProps={{
                      sx: {
                        color: "text.secondary",   // ★ 수정: 색 조금 더 흐리게
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      },
                    }}
                  />
                </ListItemButton>

                {idx < boards.length - 1 && (
                  <Divider sx={{ my: 1 }} />  // ★ 수정: Divider 간격 조절
                )}

              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default RecentViewedBoards;
