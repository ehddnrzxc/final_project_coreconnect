import React, { useState, useEffect } from "react";
import { login } from "../../auth/api/authAPI";
import { getMyProfileImage } from "../../user/api/userAPI";
import { createPasswordResetRequest } from "../../user/api/passwordResetAPI";
import {
  Box, TextField, Button, IconButton, InputAdornment,
  Alert, Stack, Checkbox, FormControlLabel, Link,
  Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import { Visibility, VisibilityOff, Close as CloseIcon } from "@mui/icons-material";
import PasswordResetDialog from "../components/PasswordResetDialog";

export default function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(() => {
    // savedEmail이 있으면 true, 없으면 false
    return !!localStorage.getItem("savedEmail");
  });
  const [error, setError] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  // 처음 렌더 시 savedEmail 복원
  useEffect(() => {
    const saved = localStorage.getItem("savedEmail");
    if(saved) setEmail(saved);
  }, []);

  const handleOpenReset = () => {
    setResetOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if(!email.trim() || !pw.trim()) {
      setError("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }
    
    try {
      const data = await login(email, pw);
      const user = {
        email: data.email,
        name: data.name,
        role: data.role,
        departmentName: data.departmentName,
        jobGrade: data.jobGrade,
      }
      localStorage.setItem("user", JSON.stringify(user));

      if(remember) {
        localStorage.setItem("savedEmail", email);
      } else {
        localStorage.removeItem("savedEmail");
      }

      // 프로필 이미지 동기화 - 실패해도 로그인은 유지
      try {
        const imageUrl = await getMyProfileImage();
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const nextUser = { ...storedUser, imageUrl: imageUrl || "" };
        localStorage.setItem("user", JSON.stringify(nextUser));
      } catch (err) {
        console.warn("프로필 이미지 불러오기 실패:", err);
      }
      
      onLoginSuccess?.();
    } catch (e) {
      console.error("에러:", e);
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        {/* 아이디 */}
        <TextField
          placeholder="아이디"
          autoComplete="username"
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
          autoComplete="current-password"
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
        <PasswordResetDialog
          open={resetOpen}
          email={email}
          onClose={() => setResetOpen(false)}
        />
      </Stack>
    </Box>
  );
}
