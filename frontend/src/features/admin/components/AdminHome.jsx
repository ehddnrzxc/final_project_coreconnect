import React, { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import { getAdminStats } from "../../../api/adminAPI";
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
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    departments: 0
    // 추후 전재결재 기능 추가 예정
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (e) {
        console.error("관리자 통계 불러오기 실패:", e);
      }
    };
    fetchStats();
  }, []);

  return (
    <Box
      sx={{
        px: 4,
        py: 3,
        width: "100%",
        maxWidth: 1440,   
        mx: "auto",
        color: "text.primary",
      }}
    >
      {/* 헤더 */}
      <Box sx={{ mb: 3.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1 }}>
          <Shield color="primary" sx={{ fontSize: 30 }} />
          <Typography variant="h4" fontWeight={800} sx={{ fontSize: 30 }}>
            관리자 홈
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2.5 }}>
          안녕하세요 <strong>{displayName}</strong> 님, 시스템 현황과 관리 메뉴로 빠르게
          이동하세요.
        </Typography>

        {/* 상단 퀵 버튼들 */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          <Button
            component={RouterLink}
            to="/admin/users/create"
            variant="outlined"
            startIcon={<PersonAdd />}
            sx={{
              borderRadius: 999,
              px: 2.4,
              py: 0.9,
              textTransform: "none",
            }}
          >
            사용자 생성
          </Button>

          <Button
            component={RouterLink}
            to="/admin/users"
            variant="outlined"
            startIcon={<People />}
            sx={{
              borderRadius: 999,
              px: 2.2,
              py: 0.8,
              textTransform: "none",
            }}
          >
            사용자 목록
          </Button>

          <Button
            component={RouterLink}
            to="/admin/depts"
            variant="outlined"
            startIcon={<AccountTree />}
            sx={{
              borderRadius: 999,
              px: 2.2,
              py: 0.8,
              textTransform: "none",
            }}
          >
            부서 관리
          </Button>

          <Button
            component={RouterLink}
            to="/admin/templates"
            variant="outlined"
            startIcon={<Description />}
            sx={{
              borderRadius: 999,
              px: 2.2,
              py: 0.8,
              textTransform: "none",
            }}
          >
            양식 관리
          </Button>

          <Button
            component={RouterLink}
            to="/admin/settings"
            variant="outlined"
            startIcon={<Settings />}
            sx={{
              borderRadius: 999,
              px: 2.2,
              py: 0.8,
              textTransform: "none",
            }}
          >
            시스템 설정
          </Button>
        </Box>
      </Box>

      {/* 카드 메트릭 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { icon: <People />, color: "#2e8cf0", label: "전체 사용자", value: stats.totalUsers + " 명" },
          { icon: <CheckCircle />, color: "#31b77c", label: "활성 사용자", value: stats.activeUsers + " 명" },
          { icon: <Business />, color: "#f59e0b", label: "부서 수", value: stats.departments + " 개" },
          { icon: <ErrorOutline />, color: "#ef4444", label: "승인 대기", value: "?" + " 건"},
        ].map((c, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2.5,
                p: 2.5,
                borderRadius: 3,
                boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
              }}
            >
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                  bgcolor: c.color,
                  flexShrink: 0,
                  "& svg": { fontSize: 30 },
                }}
              >
                {c.icon}
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {c.label}
                </Typography>
                <Typography variant="h5" fontWeight={800}>
                  {c.value}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 최근 활동 & 빠른 관리 */}
      <Grid container spacing={3}>
        {/* 최근 활동 패널 */}
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
              height: "100%",
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
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
                    fontSize: 14,
                  }}
                >
                  전체보기 <ArrowForward fontSize="small" />
                </Link>
              </Box>

              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>시간</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>작업</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>대상</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>담당</TableCell>
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
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
              height: "100%",
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                빠른 관리
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
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
                    py: 0.6,
                    "&:hover": { backgroundColor: "#f3f4f6" },
                  }}
                >
                  새 사용자 등록
                </Button>

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
                    py: 0.6,
                    "&:hover": { backgroundColor: "#f3f4f6" },
                  }}
                >
                  부서 트리 편집
                </Button>

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
                    py: 0.6,
                    "&:hover": { backgroundColor: "#f3f4f6" },
                  }}
                >
                  새 결재 양식 생성
                </Button>

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
                    py: 0.6,
                    "&:hover": { backgroundColor: "#f3f4f6" },
                  }}
                >
                  권한/보안 정책
                </Button>

                <Divider sx={{ my: 0.7 }} />

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
                    py: 0.6,
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
