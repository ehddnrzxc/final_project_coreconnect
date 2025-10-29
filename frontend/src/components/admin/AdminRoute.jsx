// src/components/admin/AdminRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { isAdmin } from "../../utils/authUtils";

export default function AdminRoute({ children }) {
  // ADMIN이 아니면 접근 차단 → 홈으로 이동
  if (!isAdmin()) {
    alert("접근 권한이 없습니다. (ADMIN 전용 페이지)");
    return <Navigate to="/home" replace />;
  }

  return children; // 정상 접근 시 내부 컴포넌트 렌더링
}
