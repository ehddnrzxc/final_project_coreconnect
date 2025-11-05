import React from "react";
import { Link } from "react-router-dom";
import Card from "../../../components/ui/Card";
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
} from "@mui/material";
import AttendancePage from "./AttendancePage";
import ProfilePage from "./ProfilePage";

/* ─ Page ─ */
export default function Home() {
  return (
    <Container maxWidth={false} sx={{ py: 2, px: 2 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",                              
            md: "repeat(3, minmax(0, 1fr))",        
          },
          gap: 2,
          mb: 2,
        }}
      >
        {/* 프로필 카드 */}
        <Grid item xs={12} md={4}>
          <ProfilePage/>
        </Grid>
        {/* 메일 리스트 */}
        <Grid item xs={12} md={4}>
          <Card
            title="메일 리스트"
            right={
              <Button
                component={Link}
                to="#"
                size="small"
                sx={{ textTransform: "none" }}
              >
                받은메일함
              </Button>
            }
          >
            <List dense>
              {[
                { from: "권시정", title: "[커뮤니티 폐쇄] '테스트 커뮤니티'" },
                { from: "postmaster", title: "[NDR] Delivery Failure Notice" },
                { from: "오늘", title: "[Approval] 결재 문서" },
              ].map((m, i) => (
                <ListItem
                  key={i}
                  sx={{
                    px: 0,
                    py: 0.75,
                    borderBottom: "1px solid #e5e7eb",
                  }}
                  secondaryAction={
                    <Button size="small" sx={{ textTransform: "none" }}>
                      보기
                    </Button>
                  }
                >
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.25 }}
                      >
                        {m.from}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2">{m.title}</Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Card>
        </Grid>
        {/* 근태 */}
        <Grid item xs={12} md={4}>
          <AttendancePage/>
        </Grid>
        {/* 작성할 보고 */}
        <Grid item xs={12} md={4}>
          <Card
            title="작성할 보고"
            right={
              <Button
                component={Link}
                to="#"
                size="small"
                sx={{ textTransform: "none" }}
              >
                보고 작성
              </Button>
            }
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Chip
                  label="제 2회차"
                  size="small"
                  color="success"
                  sx={{ mb: 0.5 }}
                />
                <Typography variant="body2" sx={{ mb: 0.25 }}>
                  10/29 (수)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  test
                </Typography>
              </Box>
              <Button size="small" sx={{ textTransform: "none" }}>
                작성하기
              </Button>
            </Box>
          </Card>
        </Grid>
        {/* Quick Menu */}
        <Grid item xs={12} md={4}>
          <Card title="Quick Menu">
            <Grid container spacing={1.5}>
              {[
                { label: "메일쓰기", emoji: "✉️" },
                { label: "연락처 추가", emoji: "👤" },
                { label: "일정등록", emoji: "🗓️" },
                { label: "게시판 글쓰기", emoji: "📝" },
                { label: "설문작성", emoji: "📊" },
                { label: "다운로드", emoji: "💾" },
              ].map((q) => (
                <Grid item xs={4} key={q.label}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{
                      flexDirection: "column",
                      py: 1.2,
                      textTransform: "none",
                      borderRadius: 2,
                      bgcolor: "#f3f4f6",
                      borderColor: "transparent",
                      "&:hover": {
                        bgcolor: "#e5e7eb",
                        borderColor: "transparent",
                      },
                    }}
                  >
                    <Box sx={{ fontSize: 20, mb: 0.5 }}>{q.emoji}</Box>
                    <Typography variant="caption">{q.label}</Typography>
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Card>
        </Grid>
        {/* 전사게시판 최근글 */}
        <Grid item xs={12} md={4}>
          <Card title="전사게시판 최근글">
            <List dense sx={{ pl: 2, listStyleType: "disc" }}>
              <ListItem sx={{ display: "list-item", px: 0 }}>
                <ListItemText
                  primary="공지 테스트[2] — 2025-09-18"
                  primaryTypographyProps={{ variant: "body2" }}
                />
              </ListItem>
              <ListItem sx={{ display: "list-item", px: 0 }}>
                <ListItemText
                  primary="보안 공지 — 2025-09-05"
                  primaryTypographyProps={{ variant: "body2" }}
                />
              </ListItem>
            </List>
          </Card>
        </Grid>
        {/* 메일함 바로가기 */}
        <Grid item xs={12} md={4}>
          <Card title="메일함 바로가기">
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                받은메일함 1 • 오늘메일함 0 • 중요메일함 0
              </Typography>
              <Button variant="contained" size="small">
                이동
              </Button>
            </Box>
          </Card>
        </Grid>
        {/* 캘린더 */}
        <Grid item xs={12} md={4}>
          <Card title="캘린더" right="2025.10">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  textAlign: "center",
                  color: "text.secondary",
                  mb: 1,
                }}
              >
                {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                  <Typography key={d} variant="caption">
                    {d}
                  </Typography>
                ))}
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 0.75,
                }}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => (
                  <Box
                    key={n}
                    sx={{
                      p: 1,
                      border: "1px solid #e5e7eb",
                      borderRadius: 1.5,
                      textAlign: "right",
                      fontSize: 13,
                      ...(n === 24 && {
                        outline: "2px solid #00a0e9",
                      }),
                    }}
                  >
                    {n}
                  </Box>
                ))}
              </Box>
            </Box>
          </Card>
        </Grid>
        {/* 최근 알림 */}
        <Grid item xs={12} md={4}>
          <Card title="최근 알림">
            <List dense sx={{ pl: 1 }}>
              <ListItem sx={{ px: 0, py: 0.5 }}>
                <ListItemText
                  primary="근무상태가 출근으로 변경되었습니다. • 1시간 전"
                  primaryTypographyProps={{ variant: "body2" }}
                />
              </ListItem>
              <ListItem sx={{ px: 0, py: 0.5 }}>
                <ListItemText
                  primary="커뮤니티 폐쇄 알림 • 2시간 전"
                  primaryTypographyProps={{ variant: "body2" }}
                />
              </ListItem>
              <ListItem sx={{ px: 0, py: 0.5 }}>
                <ListItemText
                  primary="지각 처리되었습니다 • 오늘"
                  primaryTypographyProps={{ variant: "body2" }}
                />
              </ListItem>
            </List>
          </Card>
        </Grid>
        {/* 내 경비관리 */}
        <Grid item xs={12} md={4}>
          <Card title="내 경비관리" right="2025.10">
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1.5,
              }}
            >
              <Typography variant="body2">
                법인카드 0원 • 경비/일반 영수증 172,013원
              </Typography>
              <Button size="small" sx={{ textTransform: "none" }}>
                영수증 제출
              </Button>
            </Box>
            <Grid container spacing={1.5}>
              {[
                ["미결재", "2건"],
                ["결재중", "0건"],
                ["결재완료", "1건"],
              ].map(([label, value]) => (
                <Grid item xs={4} key={label}>
                  <Box
                    sx={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 2,
                      p: 1.5,
                      bgcolor: "#ffffff",
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      {label}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Card>
        </Grid>
        {/* 차량운행일지 */}
        <Grid item xs={12} md={4}>
          <Card title="차량운행일지" right="2025.10">
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  영업 3 (소나타)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  미결재된 운행일지가 1건 있습니다
                </Typography>
              </Box>
              <Button size="small" sx={{ textTransform: "none" }}>
                결재 요청하기
              </Button>
            </Box>
          </Card>
        </Grid>
      </Box>
    </Container>
  );
}
