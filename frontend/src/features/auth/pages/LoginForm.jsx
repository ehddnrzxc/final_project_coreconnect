import React, { useState, useEffect } from "react";
import { login } from "../../auth/api/authAPI";
import { setAccessToken } from "../utils/tokenUtils";
import { getMyProfileImage } from "../../user/api/userAPI";
import { createPasswordResetRequest } from "../../user/api/passwordResetAPI";
import {
  Box, TextField, Button, IconButton, InputAdornment,
  Alert, Stack, Checkbox, FormControlLabel, Link,
  Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import { Visibility, VisibilityOff, Close as CloseIcon } from "@mui/icons-material";

export default function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(() => {
    // savedEmail이 있으면 true, 없으면 false
    return !!localStorage.getItem("savedEmail");
  });
  const [error, setError] = useState("");

  // 비밀번호 초기화 모달 관련 상태
  const [resetOpen, setResetOpen] = useState(false);
  const [resetName, setResetName] = useState("");
  const [resetReason, setResetReason] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await login(email, pw);
      setAccessToken(data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      if(remember) {
        localStorage.setItem("savedEmail", email);
      } else {
        localStorage.removeItem("savedEmail");
      }

      // 프로필 이미지 동기화(선택)
      const imageUrl = await getMyProfileImage();
      const nextUser = { ...(JSON.parse(localStorage.getItem("user") || "{}")), imageUrl: imageUrl || "" };
      localStorage.setItem("user", JSON.stringify(nextUser));

      onLoginSuccess?.();
    } catch (e) {
      console.error("에러:", e);
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  // 처음 렌더 시 savedEmail 복원
  useEffect(() => {
    const saved = localStorage.getItem("savedEmail");
    if(saved) setEmail(saved);
  }, []);

  // 비밀번호 초기화 모달 열기
  const handleOpenReset = () => {
    setResetError("");
    setResetSuccess("");
    setResetName("");
    setResetReason("");
    setResetOpen(true);
  };

  // 비밀번호 초기화 모달 닫기
  const handleCloseReset = () => {
    if(resetLoading) return;
    setResetOpen(false);
  }

  // 비밀번호 초기화 요청 전송
  const handleSubmitReset = async () => {
    setResetError("");
    setResetSuccess("");

    // 간단한 클라이언트 검증
    if (!email.trim()) {
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
        email: email.trim(),
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

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        {/* 아이디 */}
        <TextField
          placeholder="아이디"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          autoFocus
          variant="outlined"
          InputProps={{
            sx: { borderRadius: 2 },
            endAdornment: (
              <InputAdornment position="end">
                {!!email && (
                  <IconButton aria-label="아이디 지우기" onClick={() => setEmail("")} edge="end" tabIndex={-1}>
                    <CloseIcon />
                  </IconButton>
                )}
              </InputAdornment>
            ),
          }}
        />

        {/* 비밀번호 */}
        <TextField
          placeholder="비밀번호"
          type={showPw ? "text" : "password"}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          fullWidth
          variant="outlined"
          InputProps={{
            sx: { borderRadius: 2 },
            endAdornment: (
              <InputAdornment position="end">
                {!!pw && (
                  <IconButton
                    onClick={() => setShowPw((v) => !v)}
                    edge="end"
                    aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {showPw ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )}
              </InputAdornment>
            ),
          }}
        />

        {/* 계정 기억 + 비밀번호 초기화 */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <FormControlLabel
            control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} size="small" />}
            label="계정 기억"
            sx={{ "& .MuiFormControlLabel-label": { fontSize: 14 } }}
          />
          <Link component="button" 
                type="button" 
                underline="none" 
                sx={{ fontSize: 14, 
                color: "black"}}
                onClick={handleOpenReset}>
            비밀번호 초기화
          </Link>
        </Box>

        {/* 에러 */}
        {error && <Alert severity="error">{error}</Alert>}

        {/* 로그인 버튼 */}
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          sx={{
            borderRadius: 2,
            py: 1.2,
            backgroundColor: "#08a7bf",
            "&:hover": { backgroundColor: "#0693a8" },
          }}
        >
          로그인
        </Button>

        {/* 비밀번호 초기화 요청 모달 */}
        <Dialog open={resetOpen} onClose={handleCloseReset} fullWidth maxWidth="xs">
          <DialogTitle>비밀번호 초기화 요청</DialogTitle>
          <DialogContent sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            {/* 이메일 (읽기 전용) */}
            <TextField
              sx={{ mt: 1 }}
              label="아이디(이메일)"
              value={email}
              fullWidth
              size="small"
              InputProps={{ readOnly: true }}
              helperText="로그인 아이디 기준으로 초기화를 요청합니다."
            />

            {/* 이름 */}
            <TextField
              label="이름"
              value={resetName}
              onChange={(e) => setResetName(e.target.value)}
              fullWidth
              size="small"
            />

            {/* 사유 (선택) */}
            <TextField
              label="요청 사유"
              value={resetReason}
              onChange={(e) => setResetReason(e.target.value)}
              fullWidth
              size="small"
              multiline
              minRows={3}
            />

            {resetError && <Alert severity="error">{resetError}</Alert>}
            {resetSuccess && <Alert severity="success">{resetSuccess}</Alert>}
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseReset} disabled={resetLoading}>
              닫기
            </Button>
            <Button
              onClick={handleSubmitReset}
              variant="contained"
              disabled={resetLoading || !!resetSuccess}
            >
              {resetLoading ? "전송 중..." : "요청 보내기"}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Box>
  );
}
