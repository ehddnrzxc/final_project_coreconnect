import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { isAdmin } from "../../utils/authUtils";

function AdminRoute() {
  // ADMIN이 아니면 접근 차단 -> 홈으로 이동
  if (!isAdmin()) {
    alert("접근 권한이 없습니다. (ADMIN 전용 페이지)");
    return <Navigate to="/home" replace />;
  }
  return <Outlet />; 
}

export default AdminRoute;

