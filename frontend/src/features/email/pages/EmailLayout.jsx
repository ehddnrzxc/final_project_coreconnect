import React from 'react';
import { Box } from "@mui/material";
import MailSidebar from "../components/MailSidebar";
import { Outlet } from "react-router-dom";

const EmailLayout = () => {
   return (
    <Box sx={{ display: "flex", height: "100vh", bgcolor: "#fafbfd" }}>
      {/* 왼쪽 MailSidebar */}
      <Box
        sx={{
          width: 260,
          bgcolor: "#fff",
          borderRight: "1px solid #e5e8ea",
          minHeight: "100vh",
        }}
      >
        <MailSidebar />
      </Box>
      {/* 오른쪽 컨텐츠 영역 */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default EmailLayout;