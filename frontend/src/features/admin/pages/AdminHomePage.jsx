import React, { useState, useEffect, useContext } from "react";
import { Link as RouterLink } from "react-router-dom";
import { getAdminStats } from "../api/adminAPI";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Divider,
} from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PeopleIcon from "@mui/icons-material/People";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import LockResetIcon from "@mui/icons-material/LockReset";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import HistoryIcon from "@mui/icons-material/History";
import { UserProfileContext } from "../../../App";

export default function AdminHomePage() {
  const { userProfile } = useContext(UserProfileContext) || {};
  const displayName = userProfile?.name || "관리자";

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    departments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (e) {
        console.error("관리자 통계 불러오기 실패:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);


  const quickActions = [
    {
      label: "사용자 생성",
      to: "/admin/users/create",
      icon: <PersonAddIcon fontSize="small" />,
    },
    {
      label: "사용자 목록",
      to: "/admin/users",
      icon: <PeopleIcon fontSize="small" />,
    },
    {
      label: "부서 관리",
      to: "/admin/departments",
      icon: <AccountTreeIcon fontSize="small" />,
    },
    {
      label: "비밀번호 초기화 요청",
      to: "/admin/password-reset-requests",
      icon: <LockResetIcon fontSize="small" />,
    },
    {
      label: "휴가 요청 관리",
      to: "/admin/leave-requests",
      icon: <BeachAccessIcon fontSize="small" />,
    },
    {
      label: "로그인 이력",
      to: "/admin/account-logs",
      icon: <HistoryIcon fontSize="small" />,
    },
  ];

  return (
    <Box sx={{ px: 4, py: 3, width: "100%", maxWidth: 1200, mx: "auto" }}>
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
          <ShieldIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={800}>
            관리자 홈
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          안녕하세요 <strong>{displayName}</strong> 님. 주요 현황과 자주 사용하는 작업으로 빠르게 이동하세요.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: "0 12px 24px rgba(15,23,42,0.05)", mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
            주요 현황
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            시스템의 주요 통계 정보입니다.
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                전체 사용자
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {loading ? "-" : `${stats.totalUsers} 명`}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                활성 사용자
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {loading ? "-" : `${stats.activeUsers} 명`}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                부서 수
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {loading ? "-" : `${stats.departments} 개`}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, boxShadow: "0 12px 24px rgba(15,23,42,0.05)" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
            빠른 작업
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            아래 버튼을 통해 주요 관리 페이지로 이동할 수 있습니다.
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1.2}>
            {quickActions.map((action) => (
              <Button
                key={action.to}
                component={RouterLink}
                to={action.to}
                variant="text"
                startIcon={action.icon}
                sx={{
                  justifyContent: "flex-start",
                  textTransform: "none",
                  color: "text.primary",
                  borderRadius: 2,
                  px: 0.6,
                  py: 0.8,
                  "&:hover": { backgroundColor: "#f5f6fa" },
                }}
              >
                {action.label}
              </Button>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
