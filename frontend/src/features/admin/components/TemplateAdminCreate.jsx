import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../../api/http.js";

// --- MUI 컴포넌트 ---
import {
  Box,
  Typography,
  Paper,
  TextField,
  Grid,
  Alert,
  CircularProgress,
} from "@mui/material";
import StyledButton from "../../../components/ui/StyledButton";

/**
 * 관리자: 새 결재 양식 생성 페이지
 * ckeditor 제거, MUI TextField로 템플릿 본문 입력
 */
function TemplateAdminCreate() {
  const navigate = useNavigate();

  const [templateName, setTemplateName] = useState("");
  const [templateKey, setTemplateKey] = useState("");
  const [templateContent, setTemplateContent] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setError(null);
    if (!templateName || !templateKey) {
      setError("양식 이름과 양식 Key는 필수입니다.");
      return;
    }
    setSubmitting(true);
    const dto = {
      templateName: templateName,
      templateKey: templateKey.toUpperCase(),
      templateContent: templateContent,
    };

    try {
      const response = await http.post("/admin/templates", dto);
      alert(`새 양식(ID: ${response.data})이 성공적으로 생성되었습니다.`);
      setError(null);
    } catch (err) {
      console.error("양식 생성 실패:", err);
      const errorMsg =
        err.response?.data?.message || err.response?.data || err.message;
      setError(errorMsg || "양식 생성 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: "auto" }}>
      <Typography variant="h4" gutterBottom>
        새 결재 양식 만들기
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="양식 이름 (예: 휴가 신청서)"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              disabled={submitting}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="양식 Key (예: VACATION)"
              value={templateKey}
              onChange={(e) => setTemplateKey(e.target.value)}
              disabled={submitting}
              helperText="React 컴포넌트와 연결될 고유값 (영문/숫자)"
            />
          </Grid>
        </Grid>
        <Box sx={{ my: 3 }}>
          <Typography variant="h6" gutterBottom>
            양식 템플릿
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            (데이터가 들어갈 자리에 [PLACEHOLDER]와 같은 치환 문자를 입력하세요.)
          </Typography>

          {/* 템플릿 본문 입력란 (ckeditor 대신 MUI TextField) */}
          <TextField
            fullWidth
            multiline
            minRows={10}
            label="템플릿 본문 입력"
            value={templateContent}
            onChange={(e) => setTemplateContent(e.target.value)}
            placeholder="여기에 템플릿 내용을 입력하세요. 예: 이름: [NAME], 부서: [DEPARTMENT] ..."
            disabled={submitting}
            sx={{ mt: 2 }}
          />
        </Box>
      </Paper>
      {/* 저장 버튼 */}
      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 1 }}>
        <StyledButton
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={submitting}
          fullWidth={false}
        >
          {submitting ? <CircularProgress size={24} /> : "양식 저장하기"}
        </StyledButton>
      </Box>
    </Box>
  );
}

export default TemplateAdminCreate;