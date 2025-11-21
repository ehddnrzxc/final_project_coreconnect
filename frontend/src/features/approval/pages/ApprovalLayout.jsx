import React, { useState } from "react";
import { Outlet, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
  ListSubheader,
} from "@mui/material";
import TemplateSelectModal from "../components/TemplateSelectModal";
import StyledButton from "../../../components/ui/StyledButton"

const navSections = [
  {
    title: "결재하기",
    items: [
      { text: "결재홈", path: "/e-approval" }, // index: true
      { text: "결재/합의 대기 문서", path: "/e-approval/pending" },
      { text: "참조 대기 문서", path: "/e-approval/refer"}
    ],
  },
  {
    title: "개인 문서함",
    items: [
      { text: "내 상신함", path: "/e-approval/my-documents" },
      { text: "임시저장함", path: "/e-approval/my-drafts" },
    ],
  },
];

function ApprovalLayout() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <Box sx={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* 1. 왼쪽 서브 네비게이션 (MUI 컴포넌트 활용) */}
      <Box
        sx={{
          width: 260,
          flexShrink: 0,
          bgcolor: '#ffffff',
          borderRight: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 상단 타이틀 및 버튼 */}
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", letterSpacing: -2 }}>
            전자결재
          </Typography>
          <StyledButton onClick={handleOpenModal}>
            새 결재 진행
          </StyledButton>
        </Box>

        <Divider />

        {/* 스크롤이 필요한 네비게이션 영역 */}
        <Box sx={{ overflowY: "auto", flex: 1 }}>
          <List component="nav" dense>
            {navSections.map((section) => (
              /*
                 <li> 태그 대신 React Fragment(<></>)를 사용합니다.
                 <li key={section.title}> 
              */
              <React.Fragment key={section.title}>
                <ListSubheader sx={{ bgcolor: "background.paper", py: 1 }}>
                  {section.title}
                </ListSubheader>
                {section.items.map((item) => (
                  <ListItemButton
                    key={item.text}
                    component={RouterLink}
                    to={item.path}
                    sx={{ pl: 3 }} // Subheader보다 살짝 들여쓰기
                  >
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                ))}
              </React.Fragment>
              /*
                 </li>
              */
            ))}
          </List>
        </Box>
      </Box>

      {/* 2. 메인 컨텐츠 영역 (하위 라우트 페이지가 렌더링될 곳) */}
      <Box
        component="main"
        sx={{
          flexGrow: 1, // 남은 공간을 모두 차지
          overflowY: "auto", // 내용이 많으면 이 영역만 스크롤
          p: 3, // 컨텐츠 영역에만 padding 적용
          bgcolor: "#f8f9fa",
        }}
      >
        {/* 하위 페이지(ApprovalHomePage 등)가 이곳에 렌더링됩니다. */}
        <Outlet />
      </Box>
      <TemplateSelectModal
        open={isModalOpen}
        handleClose={handleCloseModal}
      />
    </Box>
  );
}

export default ApprovalLayout;
