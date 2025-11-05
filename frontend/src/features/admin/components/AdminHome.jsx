import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Link,
  Divider,
} from "@mui/material";
import {
  Shield,
  PersonAdd,
  People,
  AccountTree,
  Description,
  Settings,
  CheckCircle,
  ErrorOutline,
  Business,
  ArrowForward,
  Lock,
  AddCircleOutline,
  Article,
} from "@mui/icons-material";

export default function AdminHome() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const displayName = user?.name || "관리자";

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: "auto", color: "text.primary" }}>
      {/* 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Shield color="primary" />
          <Typography variant="h4" fontWeight={800}>
            관리자 홈
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          안녕하세요 <strong>{displayName}</strong> 님, 시스템 현황과 관리 메뉴로 빠르게
          이동하세요.
        </Typography>

        {/* 상단 퀵 버튼들 */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          {/* 사용자 생성 - 기본 강조 버튼 */}
          <Button
            component={RouterLink}
            to="/admin/users/create"
            variant="outlined"
            startIcon={<PersonAdd />}
            sx={{ borderRadius: 2 }}
          >
            사용자 생성
          </Button>

          <Button
            component={RouterLink}
            to="/admin/users"
            variant="outlined"
            startIcon={<People />}
            sx={{ borderRadius: 2 }}
          >
            사용자 목록
          </Button>

          <Button
            component={RouterLink}
            to="/admin/depts"
            variant="outlined"
            startIcon={<AccountTree />}
            sx={{ borderRadius: 2 }}
          >
            부서 관리
          </Button>

          <Button
            component={RouterLink}
            to="/admin/templates"
            variant="outlined"
            startIcon={<Description />}
            sx={{ borderRadius: 2 }}
          >
            양식 관리
          </Button>

          <Button
            component={RouterLink}
            to="/admin/settings"
            variant="outlined"
            startIcon={<Settings />}
            sx={{ borderRadius: 2 }}
          >
            시스템 설정
          </Button>
        </Box>
      </Box>

      {/* 카드 메트릭 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { icon: <People />, color: "#2e8cf0", label: "전체 사용자", value: "1,248" },
          { icon: <CheckCircle />, color: "#31b77c", label: "활성 사용자", value: "1,103" },
          { icon: <Business />, color: "#f59e0b", label: "부서 수", value: "32" },
          { icon: <ErrorOutline />, color: "#ef4444", label: "승인 대기", value: "7" },
        ].map((c, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 2,
                borderRadius: 2,
                boxShadow: 1,
              }}
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: 1.5,
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                  bgcolor: c.color,
                  flexShrink: 0,
                }}
              >
                {c.icon}
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {c.label}
                </Typography>
                <Typography variant="h6" fontWeight={800}>
                  {c.value}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 최근 활동 & 빠른 관리 */}
      <Grid container spacing={2}>
        {/* 최근 활동 패널 */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1.5,
                }}
              >
                <Typography variant="h6">최근 활동</Typography>
                <Link
                  component={RouterLink}
                  to="/admin/logs"
                  underline="hover"
                  color="primary"
                  sx={{
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  전체보기 <ArrowForward fontSize="small" />
                </Link>
              </Box>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>시간</TableCell>
                    <TableCell>작업</TableCell>
                    <TableCell>대상</TableCell>
                    <TableCell>담당</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    ["10:12", "사용자 생성", "lee@coreconnect.co", "관리자"],
                    ["09:55", "권한 변경", "kim@coreconnect.co", "관리자"],
                    ["09:21", "부서 추가", "R&D 2팀", "관리자"],
                  ].map(([time, action, target, who], idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{time}</TableCell>
                      <TableCell>{action}</TableCell>
                      <TableCell>{target}</TableCell>
                      <TableCell>{who}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* 빠른 관리 패널 */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                빠른 관리
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {/* 새 사용자 등록 */}
                <Button
                  component={RouterLink}
                  to="/admin/users/create"
                  variant="text"
                  startIcon={<PersonAdd />}
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                    color: "text.primary",
                    borderRadius: 2,
                    px: 0.5,
                    "&:hover": { backgroundColor: "#f3f4f6" },
                  }}
                >
                  새 사용자 등록
                </Button>

                {/* 부서 트리 편집 */}
                <Button
                  component={RouterLink}
                  to="/admin/depts"
                  variant="text"
                  startIcon={<AccountTree />}
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                    color: "text.primary",
                    borderRadius: 2,
                    px: 0.5,
                    "&:hover": { backgroundColor: "#f3f4f6" },
                  }}
                >
                  부서 트리 편집
                </Button>

                {/* 새 결재 양식 생성 */}
                <Button
                  component={RouterLink}
                  to="/admin/templates/create"
                  variant="text"
                  startIcon={<AddCircleOutline />}
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                    color: "text.primary",
                    borderRadius: 2,
                    px: 0.5,
                    "&:hover": { backgroundColor: "#f3f4f6" },
                  }}
                >
                  새 결재 양식 생성
                </Button>

                {/* 권한/보안 정책 */}
                <Button
                  component={RouterLink}
                  to="/admin/settings"
                  variant="text"
                  startIcon={<Lock />}
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                    color: "text.primary",
                    borderRadius: 2,
                    px: 0.5,
                    "&:hover": { backgroundColor: "#f3f4f6" },
                  }}
                >
                  권한/보안 정책
                </Button>

                <Divider sx={{ my: 0.5 }} />

                {/* 감사 로그 */}
                <Button
                  component={RouterLink}
                  to="/admin/logs"
                  variant="text"
                  startIcon={<Article />}
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                    color: "text.primary",
                    borderRadius: 2,
                    px: 0.5,
                    "&:hover": { backgroundColor: "#f3f4f6" },
                  }}
                >
                  감사 로그
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
