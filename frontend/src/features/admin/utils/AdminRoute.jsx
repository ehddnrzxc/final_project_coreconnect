import React, { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { isAdmin } from "../../auth/utils/authUtils";

function AdminRoute() {
  const [adminCheck, setAdminCheck] = useState(null); // null: 확인 중, true: 관리자, false: 비관리자
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        setLoading(true);
        const isAdminUser = await isAdmin();
        setAdminCheck(isAdminUser);
      } catch (error) {
        setAdminCheck(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  // 확인 중일 때는 로딩 표시
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // ADMIN이 아니면 접근 차단 -> 홈으로 이동
  if (!adminCheck) {
    alert("접근 권한이 없습니다. (ADMIN 전용 페이지)");
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;

