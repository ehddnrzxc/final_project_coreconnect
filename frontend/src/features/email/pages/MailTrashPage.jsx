import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Button, Checkbox, Chip, Pagination, CircularProgress
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { useNavigate } from "react-router-dom";
import {
  GetUserEmailFromStorage,
  fetchTrashMails, // backend 호출 함수
  deleteMails,      // 선택 삭제(영구 삭제) 호출
  emptyTrash        // 휴지통 비우기
} from "../api/emailApi";

const MailTrashPage = () => {
  const [page, setPage] = useState(1); // UI page (1-based)
  const [size] = useState(20);
  const [total, setTotal] = useState(0);
  const [mails, setMails] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const userEmail = GetUserEmailFromStorage();
  const navigate = useNavigate();

  // robust parser for many possible response shapes
  const parsePageResponse = (res) => {
    // Development: log full response for debugging
    console.debug("[MailTrashPage] fetchTrashMails raw response:", res);

    // Try multiple common locations for paged data
    const maybe = (path) => {
      try {
        return path();
      } catch (e) {
        return undefined;
      }
    };

    // Candidate wrappers
    const r = res;
    const a = maybe(() => r.data.data);     // expected: ResponseDTO.data -> Page
    const b = maybe(() => r.data);          // some APIs: data -> Page / or ResponseDTO not used
    const c = maybe(() => r);               // fallback: the axios response object itself

    const candidates = [a, b, c].filter(Boolean);

    let pageObj = null;
    for (const cand of candidates) {
      // If it's directly an array, treat as content
      if (Array.isArray(cand)) {
        pageObj = { content: cand, totalElements: cand.length };
        break;
      }
      // If it has .content and .totalElements (Spring Page style), use it
      if (cand && (Array.isArray(cand.content) || typeof cand.totalElements !== "undefined")) {
        pageObj = cand;
        break;
      }
      // If cand itself looks like an object of items (rare), try to coerce
      if (cand && typeof cand === "object" && Object.keys(cand).length > 0) {
        // if contains numeric-indexed props, convert to array
        const possibleArray = Object.keys(cand).every(k => /^\d+$/.test(k));
        if (possibleArray) {
          const arr = Object.keys(cand).sort((x,y)=>Number(x)-Number(y)).map(k => cand[k]);
          pageObj = { content: arr, totalElements: arr.length };
          break;
        }
      }
    }

    if (!pageObj) {
      // Last resort: if res.data exists and is array, use it
      if (Array.isArray(r.data)) {
        pageObj = { content: r.data, totalElements: r.data.length };
      }
    }

    if (!pageObj) {
      // nothing matched, return empty
      return { content: [], totalElements: 0, raw: res };
    }

    // ensure content is array
    const content = Array.isArray(pageObj.content) ? pageObj.content : [];
    const totalElements = typeof pageObj.totalElements === "number"
      ? pageObj.totalElements
      : (pageObj.total ? pageObj.total : content.length);

    return { content, totalElements, pageObj };
  };

  // 휴지통 리스트 불러오기 (page is 1-based UI -> backend 0-based)
  const load = async (p = page) => {
    if (!userEmail) {
      console.warn("[MailTrashPage] No userEmail available from storage. Skipping load.");
      setMails([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchTrashMails(userEmail, p - 1, size);

      // Robust parsing
      const parsed = parsePageResponse(res);

      console.debug("[MailTrashPage] parsed page:", parsed);

      const mailList = parsed.content || [];
      setMails(mailList);
      setTotal(typeof parsed.totalElements === "number" ? parsed.totalElements : 0);
      setSelected(new Set());

      // Extra debug to ensure mail items have expected properties
      console.info("[MailTrashPage] loaded mails count =", mailList.length);
      if (mailList.length > 0) {
        console.debug("[MailTrashPage] sample mail keys:", Object.keys(mailList[0]));
      }
    } catch (err) {
      console.error("fetchTrashMails failed:", err);
      setMails([]);
      setTotal(0);
      setSelected(new Set());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
    // eslint-disable-next-line
  }, [page, size, userEmail]);

  // 휴지통 비우기
  const handleEmptyTrash = async () => {
    if (!window.confirm("휴지통을 완전히 비우시겠습니까?")) return;
    setLoading(true);
    try {
      await emptyTrash();
      setPage(1);
      await load(1);
    } catch (err) {
      console.error("emptyTrash failed:", err);
      alert("휴지통 비우기 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 선택 항목 영구 삭제
  const handleDeleteSelected = async () => {
    if (selected.size === 0) {
      alert("삭제할 메일을 선택해 주세요.");
      return;
    }
    if (!window.confirm("선택한 메일을 완전히 삭제하시겠습니까? (복구 불가)")) return;
    setLoading(true);
    try {
      const ids = Array.from(selected);
      await deleteMails({ mailIds: ids });
      await load(page);
    } catch (err) {
      console.error("deleteMails failed:", err);
      alert("선택 삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 전체선택/해제 유틸
  const allChecked = mails.length > 0 && selected.size === mails.length;
  const isIndeterminate = selected.size > 0 && selected.size < mails.length;

  // 개별 체크 토글
  const toggleSelect = (id) => {
    setSelected(prev => {
      const copy = new Set(prev);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      return copy;
    });
  };

  return (
    <Box sx={{ p: 4, minHeight: "100vh", bgcolor: "#fafbfd" }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            휴지통
          </Typography>
          <Chip label={`총 ${total}개`} sx={{ ml: 2, bgcolor: "#eceff1", fontWeight: 700 }} />
          <Box sx={{ flex: 1 }} />
          <Button
            variant="outlined"
            color="primary"
            size="small"
            sx={{ mr: 1 }}
            disabled={selected.size === 0 || loading}
            onClick={handleDeleteSelected}
          >
            선택 삭제
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            startIcon={<DeleteForeverIcon />}
            onClick={handleEmptyTrash}
            disabled={loading || total === 0}
          >
            휴지통 비우기
          </Button>
        </Box>

        <Table sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafd", borderBottom: '2px solid #e1e3ea' }}>
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  indeterminate={isIndeterminate}
                  checked={allChecked}
                  onChange={e => {
                    if (e.target.checked) setSelected(new Set(mails.map(m => m.emailId)));
                    else setSelected(new Set());
                  }}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>발신자</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>제목</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>일자</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>받는사람 메일주소</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>상태</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>액션</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box sx={{ py: 4 }}><CircularProgress /></Box>
                </TableCell>
              </TableRow>
            ) : Array.isArray(mails) && mails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">휴지통에 메일이 없습니다.</TableCell>
              </TableRow>
            ) : (
              mails.map(mail => (
                <TableRow
                  key={mail.emailId}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => navigate(`/email/${mail.emailId}`)}
                >
                  <TableCell padding="checkbox" onClick={e => e.stopPropagation()}>
                    <Checkbox
                      size="small"
                      checked={selected.has(mail.emailId)}
                      onChange={() => toggleSelect(mail.emailId)}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    {mail.senderEmail || mail.senderName || '-'}
                  </TableCell>
                  <TableCell>{mail.emailTitle || '-'}</TableCell>
                  <TableCell>
                    {mail.sentTime
                      ? (typeof mail.sentTime === "string"
                        ? new Date(mail.sentTime).toLocaleString()
                        : (mail.sentTime && mail.sentTime.toString ? new Date(mail.sentTime).toLocaleString() : "-"))
                      : "-"}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13 }}>
                    {Array.isArray(mail.recipientAddresses) && mail.recipientAddresses.length > 0
                      ? mail.recipientAddresses.map((email, idx) => (
                        <span key={email + idx}>
                          {email}
                          {idx < mail.recipientAddresses.length - 1 ? ', ' : ''}
                        </span>
                      ))
                      : '-'
                    }
                  </TableCell>
                  <TableCell align="right">
                    {mail.emailStatus || '-'}
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <IconButton size="small" onClick={() => navigate(`/email/${mail.emailId}`)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <Pagination
            count={Math.max(1, Math.ceil(total / size))}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default MailTrashPage;