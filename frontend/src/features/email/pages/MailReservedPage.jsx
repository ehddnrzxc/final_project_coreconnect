import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Button,
  Chip,
  Pagination,
  CircularProgress,
  Checkbox,
  Tooltip,
  Avatar,
  Stack,
  Tooltip as MuiTooltip
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CancelIcon from "@mui/icons-material/Cancel";
import { useNavigate } from "react-router-dom";
import {  fetchScheduledMails } from "../api/emailApi";
import useUserEmail from "../hook/useUserEmail"; // ⭐️ 여기 추가

/**
 * 예약메일함 페이지 (테이블형)
 * - 체크박스 선택, 개별/일괄 예약 취소(서버 API가 있는 경우 사용)
 * - 상세 클릭 시 /email/:emailId 로 이동
 * - 백엔드의 Page 래퍼 형식에 유연하게 대응
 */

const MailReservedPage = () => {
  const [page, setPage] = useState(1); // UI: 1-based
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [mails, setMails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const userEmail = useUserEmail(); // ⭐️ 훅으로 교체!
  const navigate = useNavigate();

  const safe = (fn, def) => {
    try {
      return fn();
    } catch (e) {
      return def;
    }
  };

  const parsePageResponse = (res) => {
    const candA = safe(() => res.data.data, null);
    const candB = safe(() => res.data, null);
    const candC = res || null;
    const candidates = [candA, candB, candC].filter(Boolean);

    for (const cand of candidates) {
      if (cand && Array.isArray(cand.content)) {
        return {
          content: cand.content,
          totalElements:
            typeof cand.totalElements === "number"
              ? cand.totalElements
              : cand.content.length
        };
      }
      if (Array.isArray(cand)) {
        return { content: cand, totalElements: cand.length };
      }
      if (cand && Array.isArray(cand.data)) {
        return {
          content: cand.data,
          totalElements: cand.total || cand.data.length || 0
        };
      }
    }
    return { content: [], totalElements: 0 };
  };

  const load = async (p = page) => {
    if (!userEmail) {
      setMails([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchScheduledMails(userEmail, p - 1, size);
      const parsed = parsePageResponse(res);
      setMails(parsed.content || []);
      setTotal(typeof parsed.totalElements === "number" ? parsed.totalElements : 0);
      setSelected(new Set());
    } catch (err) {
      console.error("fetchScheduledMails failed:", err);
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

  const handleSelectToggle = (id) => {
    setSelected((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const allChecked = mails.length > 0 && selected.size === mails.length;
  const isIndeterminate = selected.size > 0 && selected.size < mails.length;

  const handleSelectAll = (checked) => {
    if (checked) setSelected(new Set(mails.map((m) => m.emailId)));
    else setSelected(new Set());
  };

  // 예약 취소 (서버에 cancel API가 있다면 /api/v1/email/{id}/cancel 같은 엔드포인트 호출)
  const cancelScheduled = async (emailId) => {
    if (!window.confirm("선택한 예약메일을 취소하시겠습니까?")) return;
    try {
      // Try calling expected cancel endpoint. If your backend path differs, adapt it.
      const resp = await fetch(`/api/v1/email/${emailId}/cancel`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || "예약취소 실패");
      }
      alert("예약이 취소되었습니다.");
      load(page);
    } catch (err) {
      console.error("cancelScheduled failed:", err);
      alert("예약 취소 중 오류가 발생했습니다.");
    }
  };

  const handleCancelSelected = async () => {
    if (selected.size === 0) {
      alert("취소할 예약메일을 선택하세요.");
      return;
    }
    if (!window.confirm("선택한 예약메일들을 취소하시겠습니까?")) return;
    // iterate and cancel (could be optimized server-side with batch API)
    for (const id of Array.from(selected)) {
      // eslint-disable-next-line no-await-in-loop
      await cancelScheduled(id);
    }
    load(page);
  };

  const formatDateTime = (v) => {
    try {
      if (!v) return "-";
      const d = new Date(v);
      if (isNaN(d.getTime())) return v;
      return d.toLocaleString();
    } catch {
      return v;
    }
  };

  // helper: sender avatar initials
  const initials = (nameOrEmail) => {
    if (!nameOrEmail) return "U";
    const parts = nameOrEmail.split(/[\s@._-]+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  return (
    <Box sx={{ p: 4, minHeight: "100vh", bgcolor: "#fafbfd" }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            예약메일함
          </Typography>
          <Chip label={`총 ${total}개`} sx={{ bgcolor: "#eceff1", fontWeight: 700 }} />
          <Box sx={{ flex: 1 }} />
          <Button variant="outlined" size="small" onClick={() => load(1)} disabled={loading}>
            새로고침
          </Button>
          <Button
            variant="contained"
            size="small"
            color="error"
            startIcon={<CancelIcon />}
            onClick={handleCancelSelected}
            disabled={selected.size === 0 || loading}
          >
            선택 취소
          </Button>
        </Stack>

        <Table sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafd", borderBottom: "2px solid #e1e3ea" }}>
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  indeterminate={isIndeterminate}
                  checked={allChecked}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>발신자</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>제목</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>예약일시</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>받는사람</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>상태</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>액션</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box sx={{ py: 4 }}>
                    <CircularProgress />
                  </Box>
                </TableCell>
              </TableRow>
            ) : Array.isArray(mails) && mails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  예약된 메일이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              mails.map((mail) => (
                <TableRow key={mail.emailId} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={selected.has(mail.emailId)}
                      onChange={() => handleSelectToggle(mail.emailId)}
                    />
                  </TableCell>

                  <TableCell
                    sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
                    onClick={() => navigate(`/email/${mail.emailId}`)}
                  >
                    <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: "primary.main", fontSize: 14 }}>
                      {initials(mail.senderName || mail.senderEmail)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {mail.senderName || mail.senderEmail || "-"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {mail.senderDept || ""}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell onClick={() => navigate(`/email/${mail.emailId}`)} sx={{ cursor: "pointer", maxWidth: 420 }}>
                    <Tooltip title={mail.emailTitle || "-"}>
                      <Typography noWrap>{mail.emailTitle || "-"}</Typography>
                    </Tooltip>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {mail.emailContent ? (mail.emailContent.length > 140 ? `${mail.emailContent.slice(0, 140)}...` : mail.emailContent) : ""}
                    </Typography>
                  </TableCell>

                  <TableCell onClick={() => navigate(`/email/${mail.emailId}`)} sx={{ cursor: "pointer" }}>
                    {formatDateTime(mail.reservedAt)}
                  </TableCell>

                  <TableCell onClick={() => navigate(`/email/${mail.emailId}`)} sx={{ cursor: "pointer" }}>
                    {Array.isArray(mail.recipientAddresses) && mail.recipientAddresses.length > 0 ? (
                      <Stack direction="row" spacing={0.5}>
                        {mail.recipientAddresses.slice(0, 3).map((r, idx) => (
                          <Chip key={r + idx} label={r} size="small" />
                        ))}
                        {mail.recipientAddresses.length > 3 && (
                          <MuiTooltip title={mail.recipientAddresses.join(", ")}>
                            <Chip label={`+${mail.recipientAddresses.length - 3}`} size="small" />
                          </MuiTooltip>
                        )}
                      </Stack>
                    ) : (
                      "-"
                    )}
                  </TableCell>

                  <TableCell align="right">
                    <Chip label={mail.emailStatus || "-"} size="small" />
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="상세보기">
                        <IconButton size="small" onClick={() => navigate(`/email/${mail.emailId}`)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="예약취소">
                        <IconButton size="small" onClick={() => cancelScheduled(mail.emailId)}>
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", my: 3 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              페이지 {page} / {Math.max(1, Math.ceil(total / size))}
            </Typography>
          </Box>
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

export default MailReservedPage;