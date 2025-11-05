import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../../api/http.js";

// --- Decoupled-Document 에디터 import ---
import { CKEditor } from "@ckeditor/ckeditor5-react";
import DecoupledEditor from "@ckeditor/ckeditor5-build-decoupled-document";

// --- MUI 컴포넌트 ---
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
} from "@mui/material";

/**
 * 관리자: 새 결재 양식 생성 페이지
 * [수정] useRef를 사용하여 툴바를 안정적으로 연결
 */
function TemplateAdminCreate() {
  const navigate = useNavigate();

  // [추가] 툴바 DOM을 직접 가리킬 Ref 생성
  const toolbarRef = useRef(null);

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
    <Box sx={{ p: 3, maxWidth: 1000, margin: "auto" }}>
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
            (데이터가 들어갈 자리에 [PLACEHOLDER]와 같은 치환 문자를
            입력하세요.)
          </Typography>
          
          {/* [수정] "overflow: 'hidden'" 속성 제거 */}
          <Box sx={{ border: "1px solid #ddd", borderRadius: 1 }}>
            {/* 1. 툴바가 렌더링될 위치 (Box) */}
            <div
              ref={toolbarRef}
              className="ck-toolbar-container"
              style={{ borderBottom: "1px solid #ddd" }}
            ></div>

            {/* 2. 에디터 본문이 렌더링될 위치 */}
            <Box className="ck-editor-editable-area" sx={{ minHeight: "400px", padding: "1rem" }}>
              <CKEditor
                editor={DecoupledEditor}
                data={templateContent}
                onReady={(editor) => {
                  console.log("CKEditor5 DecoupledEditor is ready.", editor);
                  
                  if (toolbarRef.current && toolbarRef.current.children.length === 0) {
                    toolbarRef.current.appendChild(editor.ui.view.toolbar.element);
                  } else if (!toolbarRef.current) {
                    console.error("CKEditor: toolbarRef.current is null.");
                  }
                }}
                onChange={(event, editor) => {
                  const data = editor.getData();
                  setTemplateContent(data);
                }}
              />
            </Box>
          </Box>
        </Box>
      </Paper>
      {/* 4. 저장 버튼 */} <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 1 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <CircularProgress size={24} /> : "양식 저장하기"}
        </Button>
      </Box>
    </Box>
  );
}

export default TemplateAdminCreate;