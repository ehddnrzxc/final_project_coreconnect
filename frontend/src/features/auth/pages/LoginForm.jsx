import React, { useState } from "react";
import { login } from "../../auth/api/authAPI";
import { setAccessToken } from "../utils/tokenUtils";
import { getMyProfileImage } from "../../user/api/userAPI";
import {
  Box, TextField, Button, IconButton, InputAdornment,
  Alert, Stack, Checkbox, FormControlLabel, Link
} from "@mui/material";
import { Visibility, VisibilityOff, Close as CloseIcon } from "@mui/icons-material";

export default function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await login(email, pw);
      setAccessToken(data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));

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
          <Link component="button" type="button" underline="none" 
          sx={{ fontSize: 14,
                color: "black",
          }}>
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
      </Stack>
    </Box>
  );
}
