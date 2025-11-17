import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, ButtonGroup, Button, InputBase, Divider, Checkbox, Chip, Pagination, Badge, Tabs, Tab,
  Snackbar, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ReportIcon from '@mui/icons-material/Report';
import ReplyIcon from '@mui/icons-material/Reply';
import DeleteIcon from '@mui/icons-material/Delete';
import TagIcon from '@mui/icons-material/LocalOffer';
import ForwardIcon from '@mui/icons-material/Forward';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SyncIcon from '@mui/icons-material/Sync';
import ViewListIcon from '@mui/icons-material/ViewList';

import { fetchInbox, fetchUnreadCount, GetUserEmailFromStorage, deleteMails } from '../api/emailApi';
import { useNavigate, useLocation } from 'react-router-dom';

const MailInboxPage = () => {
  const [tab, setTab] = useState("all"); // all|today|unread
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [mails, setMails] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [snack, setSnack] = useState({ open: false, severity: 'info', message: '' });
  const userEmail = GetUserEmailFromStorage();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabQuery = searchParams.get('tab');
    if (tabQuery && ["all", "today", "unread"].includes(tabQuery) && tab !== tabQuery) {
      setTab(tabQuery);
    }
    // eslint-disable-next-line
  }, [location.search]);

  // function to load inbox (used on mount and after delete)
  const loadInbox = async (pageIdx = page, pageSize = size, activeTab = tab) => {
    if (!userEmail) return;
    try {
      const res = await fetchInbox(userEmail, pageIdx - 1, pageSize, activeTab === "all" ? null : activeTab);
      const boxData = res?.data?.data;
      const mailList = Array.isArray(boxData?.content) ? boxData.content : [];
      setMails(mailList);
      setTotal(typeof boxData?.totalElements === "number" ? boxData.totalElements : 0);
      // Clear selection if items changed
      setSelected(prev => {
        // remove any selected ids that are no longer visible on this page
        const idsOnPage = new Set(mailList.map(m => m.emailId));
        const newSet = new Set([...prev].filter(id => idsOnPage.has(id)));
        return newSet;
      });
    } catch (err) {
      console.error("fetchInbox error", err);
      setMails([]);
      setTotal(0);
    }
  };

  useEffect(() => {
    loadInbox();
    // eslint-disable-next-line
  }, [userEmail, page, size, tab]);

  useEffect(() => {
    if (!userEmail) return;
    fetchUnreadCount(userEmail)
      .then(count => setUnreadCount(count || 0))
      .catch(() => setUnreadCount(0));
  }, [userEmail]);

  // toggle single select
  const toggleSelect = (mailId) => {
    setSelected(prev => {
      const s = new Set(prev);
      if (s.has(mailId)) s.delete(mailId);
      else s.add(mailId);
      return s;
    });
  };

  // select all on current page
  const toggleSelectAll = () => {
    setSelected(prev => {
      const idsOnPage = mails.map(m => m.emailId);
      const allSelected = idsOnPage.every(id => prev.has(id));
      if (allSelected) {
        // unselect all on page
        const s = new Set(prev);
        idsOnPage.forEach(id => s.delete(id));
        return s;
      } else {
        const s = new Set(prev);
        idsOnPage.forEach(id => s.add(id));
        return s;
      }
    });
  };

  // delete selected mails for current user (calls backend DELETE /api/v1/email with { mailIds: [...] })
  const deleteSelected = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      setSnack({ open: true, severity: 'warning', message: '삭제할 메일을 선택하세요.' });
      return;
    }
    if (!window.confirm(`선택한 ${ids.length}개의 메일을 휴지통으로 이동하시겠습니까?`)) return;

    try {
      // API 모듈 사용 (deleteMails는 /api/v1/email로 요청)
      await deleteMails(ids);

      setSnack({ open: true, severity: 'success', message: `${ids.length}개의 메일을 휴지통으로 이동했습니다.` });
      setSelected(prev => {
        const s = new Set(prev);
        ids.forEach(id => s.delete(id));
        return s;
      });
      // reload current page
      await loadInbox();
    } catch (err) {
      console.error('deleteSelected error', err);
      setSnack({ open: true, severity: 'error', message: '메일 삭제 중 오류가 발생했습니다.' });
    }
  };

  // helper to render sentTime nicely
  const formatSentTime = (sentTime) => {
    if (!sentTime) return '-';
    try {
      return (typeof sentTime === "string") ? new Date(sentTime).toLocaleString() : new Date(sentTime).toLocaleString();
    } catch {
      return '-';
    }
  };

  return (
    <Box sx={{ p: 4, minHeight: "100vh", bgcolor: "#fafbfd" }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
        {/* 상단 타이틀 및 탭 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            받은메일함
          </Typography>
          <Chip
            label={`안읽은 메일 : ${unreadCount}개`}
            color={unreadCount > 0 ? "error" : "default"}
            size="small"
            sx={{ ml: 2, fontWeight: 700 }}
          />
          <Typography sx={{ ml: 2, color: 'text.secondary', fontSize: 15 }}>
            전체메일 <b>{total}</b>
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Paper
            component="form"
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: 250,
              p: '2px 8px',
              borderRadius: 1,
              bgcolor: '#f8fafb',
              border: '1px solid #e2e6ea',
              mr: 2
            }}
            onSubmit={e => { e.preventDefault(); /* could call search functionality */ }}
          >
            <InputBase
              sx={{ flex: 1 }}
              placeholder="검색어를 입력하세요"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <IconButton type="submit" sx={{ p: '6px' }}>
              <SearchIcon fontSize="small" />
            </IconButton>
          </Paper>
        </Box>

        {/* 탭 필터 */}
        <Box sx={{ mt: 2, mb: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab value="all" label="전체" />
            <Tab value="today" label="오늘의 메일" />
            <Tab
              value="unread"
              label={
                <Badge badgeContent={unreadCount} color="error">
                  안읽은 메일
                </Badge>
              }
            />
          </Tabs>
        </Box>

        {/* 상단 툴바 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Checkbox
            sx={{ mr: 1 }}
            edge="start"
            checked={mails.length > 0 && selected.size === mails.length}
            indeterminate={selected.size > 0 && selected.size < mails.length}
            onChange={(e) => { e.stopPropagation(); toggleSelectAll(); }}
          />
          <ButtonGroup variant="text" sx={{ gap: 1 }}>
            <Button startIcon={<ReportIcon />}>스팸신고</Button>
            <Button startIcon={<ReplyIcon />}>답장</Button>
            <Button startIcon={<DeleteIcon />} onClick={deleteSelected}>삭제</Button>
            <Button startIcon={<TagIcon />}>태그</Button>
            <Button startIcon={<ForwardIcon />}>전달</Button>
            <Button startIcon={<MarkEmailReadIcon />}>읽음</Button>
            <Button startIcon={<MoveToInboxIcon />}>이동</Button>
            <Button startIcon={<MoreVertIcon />}>이메일옵션</Button>
          </ButtonGroup>
          <Box sx={{ flex: 1 }} />
          <IconButton><ViewListIcon /></IconButton>
          <IconButton><SyncIcon onClick={() => loadInbox(1, size, tab)} /></IconButton>
          <IconButton><MoreVertIcon /></IconButton>
          <Paper sx={{ ml: 1, display: 'inline-flex', alignItems: 'center', px: 0.5 }}>
            <Typography sx={{ px: 0.5, fontWeight: 500, fontSize: 15 }}>{size}</Typography>
            <IconButton size="small"><MoreVertIcon fontSize="small" /></IconButton>
          </Paper>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Table sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafd", borderBottom: '2px solid #e1e3ea' }}>
              <TableCell padding="checkbox"></TableCell>
              <TableCell sx={{ fontWeight: 700 }}>발신자</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>제목</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>일자</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>받는사람</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>상태</TableCell>
              <TableCell sx={{ fontWeight: 700 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(mails) && mails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">받은 메일이 없습니다.</TableCell>
              </TableRow>
            ) : (
              mails.map(mail => {
                const id = mail.emailId;
                const checked = selected.has(id);
                return (
                  <TableRow
                    key={id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => navigate(`/email/${id}`)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={checked}
                        onClick={e => e.stopPropagation()}
                        onChange={() => toggleSelect(id)}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {mail.senderEmail || mail.senderName || '-'}
                      {(mail.senderDept && mail.senderDept.trim() !== "") && ` / ${mail.senderDept}`}
                    </TableCell>
                    <TableCell>{mail.emailTitle}</TableCell>
                    <TableCell>{formatSentTime(mail.sentTime)}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>
                      {Array.isArray(mail.recipientAddresses)
                        ? mail.recipientAddresses.join(', ')
                        : ''}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={mail.emailStatus}
                        color={mail.emailStatus === "SENT" ? "success" : (mail.emailStatus === "FAILED" ? "error" : "default")}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={e => { e.stopPropagation(); navigate(`/email/${id}`); }}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
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

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack(prev => ({ ...prev, open: false }))} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MailInboxPage;