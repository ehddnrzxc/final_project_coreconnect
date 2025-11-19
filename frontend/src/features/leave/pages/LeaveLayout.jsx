import React from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Button,
} from "@mui/material";
import { Link as RouterLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";

/** 휴가 레이아웃 컴포넌트 */
export default function LeaveLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 현재 경로에 따라 선택된 메뉴 결정
  const isLeaveHistory = location.pathname === "/leave" || location.pathname === "/leave/history";
  const isCompanyLeave = location.pathname === "/leave/company";

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* 왼쪽 사이드바 */}
      <Paper
        elevation={2}
        sx={{
          width: 280,
          minWidth: 280,
          height: "100%",
          borderRadius: 0,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid",
          borderColor: "divider",
        }}
      >
        {/* 휴가 헤더 */}
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <BeachAccessIcon sx={{ fontSize: 24, color: "primary.main" }} />
            <Typography variant="h6" fontWeight={600}>
              휴가
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            component={RouterLink}
            to="/e-approval/new/1"
            sx={{ py: 1 }}
          >
            휴가 신청하기
          </Button>
        </Box>

        {/* 메뉴 */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <Box sx={{ p: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1, fontWeight: 600 }}
            >
              내 휴가관리
            </Typography>
            <List sx={{ p: 0 }}>
              <ListItemButton
                component={RouterLink}
                to="/leave/history"
                selected={isLeaveHistory}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "white",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                  },
                }}
              >
                <ListItemText primary="휴가내역" />
              </ListItemButton>
            </List>
          </Box>

          <Divider />

          <Box sx={{ p: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1, fontWeight: 600 }}
            >
              전사 휴가관리
            </Typography>
            <List sx={{ p: 0 }}>
              <ListItemButton
                component={RouterLink}
                to="/leave/company"
                selected={isCompanyLeave}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "white",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                  },
                }}
              >
                <ListItemText primary="전사 휴가현황" />
              </ListItemButton>
            </List>
          </Box>
        </Box>
      </Paper>

      {/* 메인 콘텐츠 영역 */}
      <Box sx={{ flex: 1, overflowY: "auto", bgcolor: "background.default" }}>
        <Outlet />
      </Box>
    </Box>
  );
}

