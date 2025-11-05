import React, { useEffect, useState } from "react";
import http from "../../../api/http"; 
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Typography,
  Alert,
  Stack,
  Divider,
} from "@mui/material";

export default function UserCreateForm() {
  const [form, setForm] = useState({
    email: "",
    name: "",
    tempPassword: "",
    phone: "",
    deptId: "",
    role: "USER",
  });

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  /** ─ 부서 목록 로드 ─ */
  useEffect(() => {
    http
      .get("/departments/flat")
      .then(({ data }) => setDepartments(data))
      .catch(() =>
        setMsg({
          type: "info",
          text: "부서 목록을 불러오지 못했습니다. (부서 없이 생성 가능)",
        })
      );
  }, []);

  /** ─ 입력 변경 핸들러 ─ */
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  /** ─ 폼 제출 ─ */
  const submit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!form.email || !form.name || !form.tempPassword) {
      setMsg({ type: "error", text: "이메일 / 이름 / 임시비밀번호는 필수입니다." });
      return;
    }

    const payload = {
      email: form.email.trim(),
      name: form.name.trim(),
      tempPassword: form.tempPassword,
      phone: form.phone.trim() || undefined,
      role: form.role,
      ...(form.deptId ? { deptId: Number(form.deptId) } : {}),
    };

    setLoading(true);
    try {
      const { data } = await http.post("/admin/users", payload);
      setMsg({ type: "success", text: `생성 완료: ${data.name} (${data.email})` });

      // 폼 초기화
      setForm({
        email: "",
        name: "",
        tempPassword: "",
        phone: "",
        deptId: "",
        role: "USER",
      });
    } catch (e) {
      const status = e.response?.status;
      const message = e.response?.data?.message;

      if (status === 401) {
        setMsg({
          type: "error",
          text: "인증이 만료되었거나 권한이 없습니다. 다시 로그인하세요.",
        });
      } else {
        setMsg({
          type: "error",
          text: `유저 생성 실패: ${message || "서버 오류"}`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getSeverity = (type) => {
    if (type === "success") return "success";
    if (type === "error") return "error";
    return "info";
  };

  /** ─ 렌더링 ─ */
  return (
    <Box
      sx={{
        maxWidth: 640,
        mx: "auto",
        mt: 4,
        px: 2,
      }}
    >
      <Card elevation={3} sx={{ borderRadius: 3 }}>
        <CardHeader
          title={
            <Typography variant="h5" fontWeight={600}>
              사용자 생성 (관리자 전용)
            </Typography>
          }
          subheader="신규 직원을 등록하고 권한과 부서를 설정합니다."
        />
        <Divider />
        <CardContent sx={{ pt: 3, pb: 4 }}>
          <Stack spacing={2.5}>
            {msg.text && (
              <Alert severity={getSeverity(msg.type)} variant="outlined">
                {msg.text}
              </Alert>
            )}

            <Box component="form" noValidate onSubmit={submit}>
              <Stack spacing={2.5}>
                <TextField
                  label="이메일 *"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  required
                  fullWidth
                  size="medium"
                  placeholder="이메일을 입력하세요."
                />

                <TextField
                  label="이름 *"
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  required
                  fullWidth
                  size="medium"
                  placeholder="이름을 입력하세요."
                />

                <TextField
                  label="임시 비밀번호 *"
                  name="tempPassword"
                  type="text"
                  value={form.tempPassword}
                  onChange={onChange}
                  required
                  fullWidth
                  size="medium"
                  placeholder="임시 비밀번호를 입력하세요."
                />

                <TextField
                  label="전화번호"
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  fullWidth
                  size="medium"
                  placeholder="전화번호를 입력하세요."
                />

                <FormControl fullWidth size="medium">
                  <InputLabel id="dept-select-label">부서</InputLabel>
                  <Select
                    labelId="dept-select-label"
                    label="부서"
                    name="deptId"
                    value={form.deptId}
                    onChange={onChange}
                  >
                    <MenuItem value="">(선택 안 함)</MenuItem>
                    {departments.map((d) => (
                      <MenuItem key={d.id} value={d.id}>
                        {d.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="medium" required>
                  <InputLabel id="role-select-label">권한(Role)</InputLabel>
                  <Select
                    labelId="role-select-label"
                    label="권한(Role)"
                    name="role"
                    value={form.role}
                    onChange={onChange}
                  >
                    <MenuItem value="USER">USER</MenuItem>
                    <MenuItem value="MANAGER">MANAGER</MenuItem>
                    <MenuItem value="ADMIN">ADMIN</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ px: 4, py: 1.2, fontWeight: 600, borderRadius: 2 }}
                  >
                    {loading ? "생성 중..." : "유저 생성"}
                  </Button>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
