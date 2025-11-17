import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Input,
  Chip,
  Autocomplete,
  Divider,
  Stack,
  Tooltip,
  Snackbar,
  Alert
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DraftsOutlinedIcon from "@mui/icons-material/DraftsOutlined";
import ContactsIcon from "@mui/icons-material/Contacts";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import {
  sendMail,
  saveDraftMail,
  getDraftDetail,
  GetUserEmailFromStorage
} from "../api/emailApi";
import { useLocation } from "react-router-dom";

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
    emailId: null,
    recipientAddress: [],
    ccAddresses: [],
    bccAddresses: [],
    emailTitle: "",
    emailContent: "",
    attachments: [] // elements: { name, file } for new files OR { name, fileId } for existing draft files
  });
  const [reservedAt, setReservedAt] = useState(null); // 예약발송 시각 (dayjs)
  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackSeverity, setSnackSeverity] = useState("success");
  const [snackMessage, setSnackMessage] = useState("");

  const location = useLocation();
  const draftId = new URLSearchParams(location.search).get("draftId");
  const userEmail = GetUserEmailFromStorage();

  useEffect(() => {
    if (draftId && userEmail) {
      getDraftDetail(draftId, userEmail).then(res => {
        const data = res.data.data;
        setForm({
          emailId: data.emailId,
          recipientAddress: data.recipientAddresses || [],
          ccAddresses: data.ccAddresses || [],
          bccAddresses: data.bccAddresses || [],
          emailTitle: data.emailTitle || "",
          emailContent: data.emailContent || "",
          // Draft attachments might come as objects with fileId/fileName — preserve for display
          attachments: (data.attachments || []).map(f => ({
            name: f.fileName || f.fileName,
            fileId: f.fileId || null
          }))
        });
        // 예약 메일이면 예약시간 값도 추출 (백엔드 연동 시 reservedAt 필드를 사용)
        if (data.reservedAt) {
          setReservedAt(dayjs(data.reservedAt));
        }
      }).catch(err => {
        console.warn("getDraftDetail error:", err);
      });
    }
  }, [draftId, userEmail]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setForm((f) => ({
      ...f,
      attachments: [
        ...f.attachments,
        ...files.map(file => ({ name: file.name, file }))
      ]
    }));
    // reset input value to allow same file re-add if needed
    e.target.value = null;
  };

  const handleRemoveAttachment = (idx) => {
    setForm(f => ({
      ...f,
      attachments: f.attachments.filter((_, i) => i !== idx)
    }));
  };

  const handleFieldChange = (field, value) => {
    setForm(f => ({
      ...f,
      [field]: value
    }));
  };

  const buildSendFormData = (payload) => {
    // payload is plain object with fields that match backend DTO:
    // recipientAddress, ccAddresses, bccAddresses, emailTitle, emailContent, emailId(optional), reservedAt(optional), existingAttachmentIds, emailType, replyToEmailId
    const fd = new FormData();
    // Attach JSON payload as 'data' part (server expects 'data' part as JSON)
    fd.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

    // Append files that are File objects
    form.attachments.forEach((att) => {
      if (att.file && att.file instanceof File) {
        fd.append('attachments', att.file, att.name);
      }
      // If attachment has fileId (already uploaded/draft attachment), include its id in JSON payload (handled in payload)
    });

    return fd;
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      if (!form.emailTitle) {
        alert("임시저장하려면 제목은 입력해야 합니다.");
        setSavingDraft(false);
        return;
      }

      // build draft DTO — include existing attachment fileIds but do not re-upload files
      const draftData = {
        emailId: form.emailId,
        recipientAddress: form.recipientAddress,
        ccAddresses: form.ccAddresses,
        bccAddresses: form.bccAddresses,
        emailTitle: form.emailTitle,
        emailContent: form.emailContent,
        emailFolder: "DRAFT",
        reservedAt: reservedAt ? reservedAt.format("YYYY-MM-DDTHH:mm:ss") : null,
        // collect fileIds of existing attachments (if any)
        existingAttachmentIds: form.attachments
          .filter(a => a.fileId)
          .map(a => a.fileId)
      };

      // For drafts with new files, we need to send multipart formdata similar to sendMail.
      // If there are new File objects, use FormData and call backend draft endpoint that accepts multipart/form-data.
      const newFiles = form.attachments.filter(a => a.file && a.file instanceof File);
      if (newFiles.length > 0) {
        const fd = new FormData();
        fd.append('data', new Blob([JSON.stringify(draftData)], { type: 'application/json' }));
        newFiles.forEach(f => fd.append('attachments', f.file, f.name));
        await saveDraftMail(fd); // saveDraftMail should accept FormData for multipart
      } else {
        await saveDraftMail(draftData); // fallback: if API accepts JSON for drafts without new files
      }

      setSnackSeverity("success");
      setSnackMessage("임시저장되었습니다!");
      setSnackOpen(true);

      setForm({
        emailId: null,
        recipientAddress: [],
        ccAddresses: [],
        bccAddresses: [],
        emailTitle: "",
        emailContent: "",
        attachments: []
      });
      setReservedAt(null);
    } catch (e) {
      console.error("saveDraft error:", e);
      setSnackSeverity("error");
      setSnackMessage("임시저장 실패: " + (e?.response?.data?.message || e.message || ""));
      setSnackOpen(true);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
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
      if (!form.emailContent) {
        alert("본문을 입력해주세요.");
        setSending(false);
        return;
      }

      // IMPORTANT:
      // Build payload keys to exactly match backend EmailSendRequestDTO property names.
      const payload = {
        emailId: form.emailId,
        recipientAddress: form.recipientAddress,           // backend expects recipientAddress (array)
        ccAddresses: form.ccAddresses || [],               // ccAddresses (array)
        bccAddresses: form.bccAddresses || [],             // bccAddresses (array)
        emailTitle: form.emailTitle,                       // emailTitle (string)
        emailContent: form.emailContent,                   // emailContent (string) <-- NOT NULL in DB
        emailType: form.emailType || null,
        replyToEmailId: form.replyToEmailId || null,
        existingAttachmentIds: form.attachments
                                 .filter(a => a.fileId)
                                 .map(a => a.fileId),
        reservedAt: reservedAt ? reservedAt.format("YYYY-MM-DDTHH:mm:ss") : null
      };

      // Log payload for debug (dev only)
      console.debug("[MailWritePage] send payload:", payload);

      const fd = buildSendFormData(payload);

      // Debug FormData entries (overview)
      const debugEntries = [...fd.entries()].map(([k, v]) => {
        if (v instanceof File) return [k, `File:${v.name} (${v.size} bytes)`];
        if (v instanceof Blob) return [k, "<Blob: JSON>"];
        return [k, v];
      });
      console.debug("[MailWritePage] FormData entries (overview):", debugEntries);

      // Debug blob JSON contents (async)
      (async () => {
        for (const [k, v] of fd.entries()) {
          if (v instanceof Blob && v.type === "application/json") {
            try {
              const txt = await v.text();
              console.debug(`[MailWritePage] FormData part '${k}' JSON:`, JSON.parse(txt));
            } catch (err) {
              console.warn("[MailWritePage] failed to parse blob JSON for part", k, err);
            }
          }
        }
      })();

      // sendMail should accept multipart/form-data FormData
      // IMPORTANT: do not set Content-Type header manually in sendMail; let browser set boundary.
      await sendMail(fd);

      setSnackSeverity("success");
      setSnackMessage(reservedAt ? "예약메일이 정상적으로 등록되었습니다!" : "메일이 정상적으로 발송되었습니다!");
      setSnackOpen(true);

      // reset form
      setForm({
        emailId: null,
        recipientAddress: [],
        ccAddresses: [],
        bccAddresses: [],
        emailTitle: "",
        emailContent: "",
        attachments: []
      });
      setReservedAt(null);
    } catch (e) {
      console.error("sendMail error:", e);
      setSnackSeverity("error");
      setSnackMessage("메일 전송 실패: " + (e?.response?.data?.message || e.message || "알 수 없는 오류"));
      setSnackOpen(true);
    } finally {
      setSending(false);
    }
  };

  const handleSnackClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackOpen(false);
  };

  return (
    <Box sx={{ py: 3, px: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mr: 2 }}>
          메일쓰기
        </Typography>
        <KeyboardArrowDownIcon />
        <Box sx={{ flex: 1 }} />
        <Tooltip title="임시저장">
          <IconButton onClick={handleSaveDraft} disabled={savingDraft}>
            <SaveOutlinedIcon />
          </IconButton>
        </Tooltip>
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
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Tooltip title="주소록"><IconButton><ContactsIcon /></IconButton></Tooltip>
          <Tooltip title="중요"><IconButton><StarOutlineIcon /></IconButton></Tooltip>
          <Tooltip title="임시저장">
            <IconButton onClick={handleSaveDraft} disabled={savingDraft}>
              <DraftsOutlinedIcon />
            </IconButton>
          </Tooltip>
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
            onChange={e => handleFieldChange("emailTitle", e.target.value)}
            placeholder="제목"
            sx={{ mr: 2 }}
          />
          <Button size="small" sx={{ minWidth: 50, fontSize: 13 }}>중요!</Button>
        </Box>
        {/* 예약 발송 입력란 추가 */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.7 }}>
          <Typography sx={{ width: 85, fontWeight: 700 }}>예약 발송</Typography>
          <DateTimePicker
            value={reservedAt}
            onChange={setReservedAt}
            minDateTime={dayjs()}
            slotProps={{ textField: { variant: 'standard', sx: { minWidth: 220 } } }}
          />
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <AttachFileIcon fontSize="small" sx={{ mr: 1, color: "#666" }} />
          <Input type="file" inputProps={{ multiple: true }} onChange={handleFileChange} />
          <Box sx={{ ml: 2, color: "text.secondary", fontSize: 13 }}>
            최대 20MB, 1회에 5MB까지
          </Box>
        </Box>
        <Box sx={{ mb: 2 }}>
          {form.attachments.map((file, idx) => (
            <Chip
              key={file.name + idx}
              label={file.name}
              sx={{ mr: 1, mb: 0.5 }}
              onDelete={() => handleRemoveAttachment(idx)}
            />
          ))}
        </Box>
        <Box sx={{ mb: 2 }}>
          <TextField
            label="본문"
            value={form.emailContent}
            onChange={e => handleFieldChange("emailContent", e.target.value)}
            fullWidth
            multiline
            rows={10}
            variant="outlined"
            placeholder="내용을 입력하세요"
          />
        </Box>
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
            disabled={sending || savingDraft}
            onClick={handleSaveDraft}
          >
            {savingDraft ? "임시 저장 중..." : "임시 저장"}
          </Button>
        </Box>
      </Paper>

      <Snackbar open={snackOpen} autoHideDuration={5000} onClose={handleSnackClose}>
        <Alert onClose={handleSnackClose} severity={snackSeverity} sx={{ width: '100%' }}>
          {snackMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default MailWritePage;