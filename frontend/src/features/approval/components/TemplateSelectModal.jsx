import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Modal,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import { getTemplates } from "../api/approvalApi"; // 양식 목록 API 임포트

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  maxHeight: "80vh", // 높이 제한
  overflowY: "auto", // 스크롤 가능
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

function TemplateSelectModal({ open, handleClose }) {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 모달이 열릴 때마다 양식 목록을 불러옵니다.
  useEffect(() => {
    if (open) {
      const fetchTemplates = async () => {
        try {
          setLoading(true);
          setError(null);
          const res = await getTemplates();
          setTemplates(res.data);
        } catch (err) {
          console.error("Error fetching templates:", err);
          setError("양식 목록을 불러오는 중 오류가 발생했습니다.");
        } finally {
          setLoading(false);
        }
      };
      fetchTemplates();
    }
  }, [open]);

  // 양식 선택 시 처리 로직
  const handleSelectTemplate = templateId => {
    handleClose(); // 모달 닫기
    // 새 문서 작성 페이지로 이동 (라우팅 경로: /e-approval/new/:templateId)
    navigate(`/e-approval/new/${templateId}`);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="template-select-modal-title"
    >
      <Box sx={style}>
        <Typography
          id="template-select-modal-title"
          variant="h6"
          component="h2"
          sx={{ mb: 2, fontWeight: "bold" }}
        >
          📝 새 결재 양식 선택
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : templates.length === 0 ? (
          <Alert severity="info">등록된 활성화된 양식이 없습니다.</Alert>
        ) : (
          <List disablePadding>
            {templates.map(temp => (
              <ListItem key={temp.templateId} disablePadding>
                <ListItemButton onClick={() => handleSelectTemplate(temp.templateId)}>
                  <ListItemText
                    primary={temp.templateName}
                    secondary={"전자결재 문서 양식"}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Modal>
  );
}

export default TemplateSelectModal;
