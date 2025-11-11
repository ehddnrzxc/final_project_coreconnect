import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, ButtonGroup, Button, InputBase, Divider, Checkbox, Chip, Pagination, Badge, Tabs, Tab
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

import { fetchInbox, fetchUnreadCount, getUserEmailFromStorage, moveToTrash } from '../api/emailApi';
import { useNavigate, useLocation } from 'react-router-dom';

const MailInboxPage = () => {
  const [tab, setTab] = useState("all"); // all|today|unread
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [mails, setMails] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selected, setSelected] = useState(new Set()); // ★ 선택된 메일 ID 관리
  const userEmail = getUserEmailFromStorage();
  const navigate = useNavigate();
  const location = useLocation(); // <-- 쿼리 문자열 인식용

  // 쿼리스트링 tab 값이 있으면 탭 상태에 반영
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabQuery = searchParams.get('tab');
    if (tabQuery && ["all", "today", "unread"].includes(tabQuery) && tab !== tabQuery) {
      setTab(tabQuery);
    }
    // eslint-disable-next-line
  }, [location.search]);

  const load = () => {
    if (!userEmail) return;
    fetchInbox(userEmail, page - 1, size, tab === "all" ? null : tab)
      .then(res => {
        const boxData = res?.data?.data;
        const mailList = Array.isArray(boxData?.content) ? boxData.content : [];
        setMails(mailList);
        setTotal(typeof boxData?.totalElements === "number" ? boxData.totalElements : 0);
        // 선택 해제 (선택 유지 원할시 주석 처리)
        setSelected(new Set());
      })
      .catch(() => {
        setMails([]);
        setTotal(0);
        setSelected(new Set());
      });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [userEmail, page, size, tab]);

  useEffect(() => {
    if (!userEmail) return;
    fetchUnreadCount(userEmail)
      .then(count => setUnreadCount(count || 0))
      .catch(() => setUnreadCount(0));
  }, [userEmail]);

  // ★ 전체선택/해제
  const allChecked = mails.length > 0 && selected.size === mails.length;
  const isIndeterminate = selected.size > 0 && selected.size < mails.length;

  // ★ 체크박스 개별 토글
  const toggleSelect = (id) => {
    setSelected(prev => {
      const copy = new Set(prev);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      return copy;
    });
  };

  // ★ 삭제 버튼 이벤트
  const handleDeleteSelected = async () => {
    if (selected.size === 0) {
      alert("삭제할 메일을 선택하세요.");
      return;
    }
    if (!window.confirm("선택한 메일을 휴지통으로 이동하시겠습니까?")) return;
    try {
      await moveToTrash(Array.from(selected));
      load();
    } catch (err) {
      alert("삭제 중 오류가 발생했습니다.");
      console.error(err);
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
            onSubmit={e => { e.preventDefault(); }}
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
          <Chip label="메가커피 900원, 선착순 1,000명" sx={{ bgcolor: "#fff0dc", fontWeight: 700 }} />
        </Box>

        {/* 탭 필터: 전체 / 오늘 / 안읽음 */}
        <Box sx={{ mt: 2, mb: 2 }}>
          <Tabs value={tab} onChange={(_,v) => setTab(v)}>
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
          {/* ★ 전체 체크박스 */}
          <Checkbox
            sx={{ mr: 1 }}
            indeterminate={isIndeterminate}
            checked={allChecked}
            onChange={e => {
              if (e.target.checked) setSelected(new Set(mails.map(m => m.emailId)));
              else setSelected(new Set());
            }}
          />
          <ButtonGroup variant="text" sx={{ gap: 1 }}>
            <Button startIcon={<ReportIcon />}>스팸신고</Button>
            <Button startIcon={<ReplyIcon />}>답장</Button>
            {/* ★ 삭제 버튼에 핸들러 연결 */}
            <Button startIcon={<DeleteIcon />} onClick={handleDeleteSelected}>삭제</Button>
            <Button startIcon={<TagIcon />}>태그</Button>
            <Button startIcon={<ForwardIcon />}>전달</Button>
            <Button startIcon={<MarkEmailReadIcon />}>읽음</Button>
            <Button startIcon={<MoveToInboxIcon />}>이동</Button>
            <Button startIcon={<MoreVertIcon />}>이메일옵션</Button>
          </ButtonGroup>
          <Box sx={{ flex: 1 }} />
          <IconButton><ViewListIcon /></IconButton>
          <IconButton><SyncIcon onClick={load} /></IconButton>
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
              <TableCell sx={{ fontWeight: 700 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(mails) && mails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">받은 메일이 없습니다.</TableCell>
              </TableRow>
            ) : (
              mails.map(mail => (
                <TableRow
                  key={mail.emailId}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={e => {
                    // 체크박스에서 발생시 상세이동 X
                    if (e.target && (e.target.type === 'checkbox' || e.target.closest('button')?.type === 'button')) return;
                    navigate(`/email/${mail.emailId}`);
                  }}
                >
                  {/* ★ 개별 체크박스(선택) 기능 */}
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={selected.has(mail.emailId)}
                      onChange={() => toggleSelect(mail.emailId)}
                      onClick={e => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    {mail.senderEmail || mail.senderName || '-'}
                    {(mail.senderDept && mail.senderDept.trim() !== "") && ` / ${mail.senderDept}`}
                  </TableCell>
                  <TableCell>{mail.emailTitle}</TableCell>
                  <TableCell>
                    {mail.sentTime
                      ? (typeof mail.sentTime === "string"
                        ? new Date(mail.sentTime).toLocaleString()
                        : mail.sentTime)
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
                    {(mail.emailStatus === "SENT" && "수신완료") ||
                     (mail.emailStatus === "REJECTED" && "반려") ||
                     (mail.emailStatus === "IN_PROGRESS" && "진행중") ||
                     (mail.emailStatus === "DRAFT" && "임시저장") ||
                     mail.emailStatus}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={e => { e.stopPropagation(); navigate(`/email/${mail.emailId}`); }}>
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
            count={Math.ceil(total / size)}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default MailInboxPage;