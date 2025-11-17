import React, { useEffect, useState } from "react";
// useEffect: 생명주기 훅 (렌더링 후 데이터 로드)
// useState: 상태 관리 훅 (최근 본 게시글 목록 저장)
import { useNavigate } from "react-router-dom"; // React Router 훅: 페이지 이동용
import { getRecentViewedBoards } from "../api/boardAPI"; // 최근 본 게시글 목록 불러오기 API 함수
import { Box, Typography, Paper, List, ListItemButton, ListItemText, Divider } from "@mui/material";
// Typography: 텍스트 표시
// Paper: 외곽이 있는 카드형 컨테이너
// List: 리스트 컨테이너
// ListItemButton: 클릭 가능한 리스트 항목
// ListItemText: 리스트 항목 텍스트
// Divider: 리스트 구분선
import { useSnackbarContext } from "../../../components/utils/SnackbarContext"; // 사용자 알림용 스낵바


// 최근 본 게시글을 보여주는 컴포넌트
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
      {/* 섹션 제목 */}
      <Typography variant="h6" sx={{ mb: 1 }}>
        🔍 최근 본 게시글
      </Typography>

      {/* 최근 본 게시글이 없을 때 표시 */}
      {boards.length === 0 ? (
        <Typography color="text.secondary">
          최근 본 게시글이 없습니다.
        </Typography>
      ) : (
        // 최근 본 게시글이 있을 때 목록 표시
        <Paper
          variant="outlined"
          sx={{
            p: 1,
            width: "90%",   // 박스 폭
            mx: "auto",     // 가운데 정렬
          }}
        >
          <List>
            {/* boards 배열을 순회하며 각 게시글을 리스트로 렌더링 */}
            {boards.map((b, idx) => (
              <React.Fragment key={b.id}>
                {/* 클릭 시 해당 게시글 상세 페이지로 이동 */}
                <ListItemButton
                  onClick={() => navigate(`/board/detail/${b.id}`)} // 게시글 ID 기반으로 상세 페이지 이동
                  sx={{ py: 1, "&:hover": { bgcolor: "#f5f5f5" } }} // hover 시 배경색 살짝 변경
                >
                  <ListItemText
                    primary={b.title}
                    secondary={`${b.writerName}${b.writerJobGrade ? ` ${b.writerJobGrade}` : ""} · ${formatDate(
                      b.createdAt
                    )} · 조회수 ${b.viewCount}`}
                  />
                </ListItemButton>
                {/* 마지막 항목이 아닐 경우 Divider(구분선) 추가 */}
                {idx < boards.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default RecentViewedBoards;  // 컴포넌트 내보내기 (다른 페이지에서 import하여 사용 가능)
