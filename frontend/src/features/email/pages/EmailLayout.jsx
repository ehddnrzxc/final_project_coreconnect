import React from 'react';
import { Box } from "@mui/material";
import MailSidebar from "../components/MailSidebar";
import { Outlet, useOutletContext } from "react-router-dom";

const EmailLayout = () => {
  // 상위 Outlet에서 context 받아옴
  const parentContext = useOutletContext();

  return (
    <Box sx={{ display: "flex", height: "100vh", bgcolor: "#fafbfd" }}>
      {/* 왼쪽 MailSidebar 
          보통 여기도 prop으로 unreadCount, refreshUnreadCount 넘기려면 
          <MailSidebar {...parentContext} /> 또는 props로 넘겨주면 됨 */}
      <Box
        sx={{
          width: 260,
          bgcolor: "#fff",
          borderRight: "1px solid #e5e8ea",
          minHeight: "100vh",
        }}
      >
        <MailSidebar {...parentContext} />
      </Box>
      {/* 오른쪽 컨텐츠 영역 - 반드시 context 다시 전달! */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Outlet context={parentContext} />
      </Box>
    </Box>
  );
};

export default EmailLayout;