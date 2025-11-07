import React, { useState } from "react";
import { Box, Paper, Typography, TextField, Button, IconButton, Input, Chip, Autocomplete, Divider, Stack, Tooltip } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DraftsOutlinedIcon from "@mui/icons-material/DraftsOutlined";
import ContactsIcon from "@mui/icons-material/Contacts";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { sendMail } from "../api/emailApi"; // 반드시 본인 api 경로로!

// 예시: 추천 이메일 리스트 (서버/DB 등에서 불러올 수 있음)
const emailSuggestions = [
  "admin@gmail.com",
  "ehddnras@gmail.com",
  "lyc@gmail.com",
  "shark@gmail.com",
  "choimeeyoung2@gmail.com",
  "sss@naver.com"
];

function MailWritePage() {
  const [form, setForm] = useState({
    recipientAddress: [],
    ccAddresses: [],
    bccAddresses: [],
    emailTitle: "",
    emailContent: "",
    attachments: []
  });
  const [sending, setSending] = useState(false);

  const handleFileChange = (e) => {
    setForm((f) => ({
      ...f,
      attachments: [...f.attachments, ...Array.from(e.target.files)]
    }));
  };

  // 파일 없이 JSON만 보낼 경우
  const plainSendMail = async (data) => {
    return await sendMail(data);
  }

  // 파일 첨부(FormData) 지원 백엔드라면 아래처럼 구성 (백엔드에 맞춰서)
  /*
  const formDataSendMail = async (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (Array.isArray(v) && k === "attachments") {
        v.forEach(file => formData.append("attachments", file));
      } else if (Array.isArray(v)) {
        v.forEach(item => formData.append(`${k}[]`, item));
      } else {
        formData.append(k, v ?? "");
      }
    });
    return await sendMail(formData);
  }
  */

  const handleSend = async () => {
    setSending(true);
    try {
      // 👇 수신자 주소 등 필수값 체크 예시
      if (!form.recipientAddress?.length) {
        alert("받는사람(수신자)을 입력해주세요.");
        setSending(false);
        return;
      }
      if (!form.emailTitle) {
        alert("제목을 입력해주세요.");
        setSending(false);
        return;
      }

      // 실제 메일 전송 (파일 첨부가 필요하다면 FormDataSendMail을 적용)
      await plainSendMail(form);

      alert("메일이 정상적으로 발송되었습니다!");
      // 필요시 입력 리셋 또는 목록 이동
      setForm({
        recipientAddress: [],
        ccAddresses: [],
        bccAddresses: [],
        emailTitle: "",
        emailContent: "",
        attachments: []
      });
    } catch (e) {
      alert(
        "메일 전송 실패: " +
          (e?.response?.data?.message || e.message || "알 수 없는 오류")
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ py: 3, px: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mr: 2 }}>
          메일쓰기
        </Typography>
        <KeyboardArrowDownIcon />
        <Box sx={{ flex: 1 }} />
        <Tooltip title="임시저장"><IconButton><SaveOutlinedIcon /></IconButton></Tooltip>
        <Tooltip title="더보기"><IconButton><MoreVertIcon /></IconButton></Tooltip>
      </Box>
      <Paper
        elevation={0}
        sx={{
          border: "1px solid #e3e4ea",
          borderRadius: 2.5,
          p: 2.5,
          bgcolor: "#fff",
          mb: 2
        }}
      >
        {/* 수신/참조/숨은참조/주소록/북마크 버튼줄 */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Tooltip title="주소록"><IconButton><ContactsIcon /></IconButton></Tooltip>
          <Tooltip title="중요"><IconButton><StarOutlineIcon /></IconButton></Tooltip>
          <Tooltip title="임시저장"><IconButton><DraftsOutlinedIcon /></IconButton></Tooltip>
          <Box sx={{ flex: 1 }} />
          <Button variant="outlined" size="small" sx={{ px: 2, fontWeight: 600 }}>받는사람</Button>
          <Button variant="text" size="small" sx={{ px: 2 }}>참조</Button>
          <Button variant="text" size="small" sx={{ px: 2 }}>숨은참조</Button>
        </Stack>

        <Box sx={{ display: "flex", alignItems: "center", mb: 0.7 }}>
          <Typography sx={{ width: 85, fontWeight: 700 }}>받는사람</Typography>
          <Autocomplete
            multiple
            freeSolo
            options={emailSuggestions}
            value={form.recipientAddress}
            onChange={(e, value) => setForm(f => ({ ...f, recipientAddress: value }))}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option + index} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="이메일 주소 입력"
                variant="standard"
                sx={{ minWidth: 240 }}
              />
            )}
            sx={{ flex: 1 }}
          />
          <Button size="small" sx={{ ml: 1, minWidth: 50, fontSize: 13 }}>주소록</Button>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.7 }}>
          <Typography sx={{ width: 85, fontWeight: 700 }}>참조</Typography>
          <Autocomplete
            multiple
            freeSolo
            options={emailSuggestions}
            value={form.ccAddresses}
            onChange={(e, value) => setForm(f => ({ ...f, ccAddresses: value }))}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option + index} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="이메일 주소 입력"
                variant="standard"
                sx={{ minWidth: 240 }}
              />
            )}
            sx={{ flex: 1 }}
          />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.7 }}>
          <Typography sx={{ width: 85, fontWeight: 700 }}>숨은참조</Typography>
          <Autocomplete
            multiple
            freeSolo
            options={emailSuggestions}
            value={form.bccAddresses}
            onChange={(e, value) => setForm(f => ({ ...f, bccAddresses: value }))}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option + index} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="이메일 주소 입력"
                variant="standard"
                sx={{ minWidth: 240 }}
              />
            )}
            sx={{ flex: 1 }}
          />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.7 }}>
          <Typography sx={{ width: 85, fontWeight: 700 }}>제목</Typography>
          <TextField
            variant="standard"
            fullWidth
            value={form.emailTitle}
            onChange={e => setForm(f => ({ ...f, emailTitle: e.target.value }))}
            placeholder="제목"
            sx={{ mr: 2 }}
          />
          <Button size="small" sx={{ minWidth: 50, fontSize: 13 }}>중요!</Button>
        </Box>
        <Divider sx={{ my: 2 }} />
        {/* 첨부파일 */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <AttachFileIcon fontSize="small" sx={{ mr: 1, color: "#666" }} />
          <Input type="file" inputProps={{ multiple: true }} onChange={handleFileChange} />
          <Box sx={{ ml: 2, color: "text.secondary", fontSize: 13 }}>
            최대 20MB, 1회에 5MB까지
          </Box>
        </Box>
        {/* 첨부파일 리스트 */}
        <Box sx={{ mb: 2 }}>
          {form.attachments.map((file, idx) => (
            <Chip
              key={file.name + idx}
              label={file.name}
              sx={{ mr: 1, mb: 0.5 }}
              onDelete={() =>
                setForm(f => ({
                  ...f,
                  attachments: f.attachments.filter((_, i) => i !== idx)
                }))
              }
            />
          ))}
        </Box>
        {/* 본문 */}
        <Box sx={{ mb: 2 }}>
          <TextField
            label="본문"
            value={form.emailContent}
            onChange={e => setForm(f => ({ ...f, emailContent: e.target.value }))}
            fullWidth
            multiline
            rows={10}
            variant="outlined"
            placeholder="내용을 입력하세요"
          />
          {/* 실제 서비스에서는 HTML 편집기(smarteditor2, quill 등) 삽입 가능 */}
        </Box>
        {/* 메일 전송 버튼 */}
        <Box sx={{ display: "flex", alignItems: "center", mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<SendIcon />}
            sx={{ mr: 2, minWidth: 120, fontWeight: 700 }}
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? "전송 중..." : "메일 발송"}
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<SaveOutlinedIcon />}
            sx={{ minWidth: 120, fontWeight: 700 }}
            disabled={sending}
          >
            임시 저장
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default MailWritePage;