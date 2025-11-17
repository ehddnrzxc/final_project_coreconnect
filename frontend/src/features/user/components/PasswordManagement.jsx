import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import InfoIcon from "@mui/icons-material/Info";
import { changePassword } from "../api/userAPI";
import { logout } from "../../auth/api/authAPI";

const PasswordManagement = ({ onBack, theme }) => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 유효성 검사
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("모든 필드를 입력해주세요.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 16) {
      setError("비밀번호는 8~16자로 입력해주세요.");
      return;
    }

    // 영문, 숫자, 특수문자 조합 확인
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasLetter || !hasNumber || !hasSpecial) {
      setError("비밀번호는 영문자, 숫자, 특수문자를 조합하여 사용해주세요.");
      return;
    }

    try {
      setLoading(true);
      await changePassword(currentPassword, newPassword, confirmPassword);
      
      // 비밀번호 변경 성공 안내
      alert("비밀번호가 성공적으로 변경되었습니다.\n로그인 페이지로 이동합니다.");
      
      // 로그아웃 처리
      try {
        await logout();
      } catch (logoutErr) {
        console.error("로그아웃 API 호출 실패:", logoutErr);
      }
      
      // 로그인 페이지로 이동
      navigate("/login");
    } catch (err) {
      if (err.response?.status === 400) {
        const message = err.response?.data || "현재 비밀번호가 일치하지 않습니다.";
        setError(typeof message === "string" ? message : "현재 비밀번호가 일치하지 않습니다.");
      } else {
        setError("비밀번호 변경에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <IconButton size="small" onClick={onBack}
          sx={{ border: `1px solid ${theme.palette.divider}` }}>
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <Typography variant="h5">
          비밀번호 변경
        </Typography>
      </Stack>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          maxWidth: 540,
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <TextField
          fullWidth
          label="현재 비밀번호"
          type={showCurrentPassword ? "text" : "password"}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="현재 사용중인 비밀번호를 입력해주세요"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  edge="end"
                >
                  {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          label="새 비밀번호"
          type={showNewPassword ? "text" : "password"}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="새 비밀번호를 입력해주세요"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  edge="end"
                >
                  {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          label="새 비밀번호 확인"
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="새 비밀번호를 한번 더 입력해주세요"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  edge="end"
                >
                  {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {error && (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        )}

        <Box
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            p: 2,
            bgcolor: "action.hover",
          }}
        >
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            <InfoIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" fontWeight={600}>
              비밀번호 설정 방법
            </Typography>
          </Stack>
          <Stack spacing={0.5} sx={{ pl: 4 }}>
            <Typography variant="body2" color="text.secondary">
              • 8~16자의 영문자, 숫자, 특수문자를 조합하여 사용하세요.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • 연속한 문자와 숫자, 동일 문자 반복, 키보드 순차 배열 구성을 피해주세요.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • 이전 비밀번호의 재사용을 피해주세요.
            </Typography>
          </Stack>
        </Box>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{
            py: 1.5,
            borderRadius: 2,
            bgcolor: "#00a0e9",
            "&:hover": {
              bgcolor: "#0088c7",
            },
          }}
        >
          저장
        </Button>
      </Box>
    </Box>
  );
};

export default PasswordManagement;

