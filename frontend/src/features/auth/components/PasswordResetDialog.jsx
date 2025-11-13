import React, { useState, useEffect } from 'react';
import { createPasswordResetRequest } from '../../user/api/passwordResetAPI';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Alert,
} from "@mui/material";

const PasswordResetDialog = ({ open, email, onClose }) => {

  const [resetEmail, setResetEmail] = useState(email || "");
  const [resetName, setResetName] = useState("");
  const [resetReason, setResetReason] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  // 다이얼로그가 열릴 때마다 / email 변경 시 초기값 세팅
  useEffect(() => {
    if (open) {
      setResetEmail(email || "");
      setResetName("");
      setResetReason("");
      setResetError("");
      setResetSuccess("");
    }
  }, [open, email]);

  // 비밀번호 초기화 요청 전송
  const handleSubmit = async () => {
    setResetError("");
    setResetSuccess("");

    // 간단한 클라이언트 검증
    if (!resetEmail.trim()) {
      setResetError("아이디(이메일)를 먼저 입력해주세요.");
      return;
    }
    if (!resetName.trim()) {
      setResetError("이름을 입력해주세요.");
      return;
    }

    try {
      setResetLoading(true);
      await createPasswordResetRequest({
        email: resetEmail.trim(),
        name: resetName.trim(),
        reason: resetReason.trim(),
      });
      setResetSuccess("비밀번호 초기화 요청이 전송되었습니다. 관리자의 승인을 기다려주세요.");
    } catch (err) {
      console.error("비밀번호 초기화 요청 에러:", err);
      setResetError("요청 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleClose = () => {
    // 닫을 때 상태도 같이 초기화
    setResetName("");
    setResetReason("");
    setResetError("");
    setResetSuccess("");
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>비밀번호 초기화 요청</DialogTitle>
      <DialogContent sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* 이메일 */}
        <TextField
          sx={{ mt: 1 }}
          label="아이디(이메일)"
          type="email"
          value={resetEmail}
          fullWidth
          size="small"
          helperText="로그인 아이디 기준으로 초기화를 요청합니다."
          onChange={(e) => setResetEmail(e.target.value)}
          disabled={resetLoading || !!resetSuccess}
        />

        {/* 이름 */}
        <TextField
          label="이름"
          value={resetName}
          onChange={(e) => setResetName(e.target.value)}
          fullWidth
          size="small"
          disabled={resetLoading || !!resetSuccess}
        />

        {/* 사유 */}
        <TextField
          label="요청 사유"
          value={resetReason}
          onChange={(e) => setResetReason(e.target.value)}
          fullWidth
          size="small"
          multiline
          minRows={3}
          disabled={resetLoading || !!resetSuccess}
        />

        {resetError && <Alert severity="error">{resetError}</Alert>}
        {resetSuccess && <Alert severity="success">{resetSuccess}</Alert>}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={resetLoading}>
          닫기
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={resetLoading || !!resetSuccess}
        >
          {resetLoading ? "전송 중..." : "요청 보내기"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PasswordResetDialog;