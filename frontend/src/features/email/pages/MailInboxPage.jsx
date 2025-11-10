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

import { fetchInbox, fetchUnreadCount, getUserEmailFromStorage } from '../api/emailApi';
import { useNavigate, useLocation } from 'react-router-dom';

const MailInboxPage = () => {
  const [tab, setTab] = useState("all"); // all|today|unread
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [mails, setMails] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const userEmail = getUserEmailFromStorage();
  const navigate = useNavigate();
  const location = useLocation(); // <-- 쿼리 문자열 인식용

  // ★ 추가: 쿼리스트링 tab 값이 있으면 탭 상태에 반영
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabQuery = searchParams.get('tab');
    if (tabQuery && ["all", "today", "unread"].includes(tabQuery) && tab !== tabQuery) {
      setTab(tabQuery);
    }
    // eslint-disable-next-line
  }, [location.search]);

  useEffect(() => {
    if (!userEmail) return;
    // 필터: today, unread, all(null/기본)
    fetchInbox(userEmail, page - 1, size, tab === "all" ? null : tab)
      .then(res => {
        const boxData = res?.data?.data;
        const mailList = Array.isArray(boxData?.content) ? boxData.content : [];
        setMails(mailList);
        setTotal(typeof boxData?.totalElements === "number" ? boxData.totalElements : 0);
      })
      .catch(() => {
        setMails([]);
        setTotal(0);
      });
  }, [userEmail, page, size, tab]);

  useEffect(() => {
    if (!userEmail) return;
    fetchUnreadCount(userEmail)
      .then(count => setUnreadCount(count || 0))
      .catch(() => setUnreadCount(0));
  }, [userEmail]);

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
          <Checkbox sx={{ mr: 1 }} />
          <ButtonGroup variant="text" sx={{ gap: 1 }}>
            <Button startIcon={<ReportIcon />}>스팸신고</Button>
            <Button startIcon={<ReplyIcon />}>답장</Button>
            <Button startIcon={<DeleteIcon />}>삭제</Button>
            <Button startIcon={<TagIcon />}>태그</Button>
            <Button startIcon={<ForwardIcon />}>전달</Button>
            <Button startIcon={<MarkEmailReadIcon />}>읽음</Button>
            <Button startIcon={<MoveToInboxIcon />}>이동</Button>
            <Button startIcon={<MoreVertIcon />}>이메일옵션</Button>
          </ButtonGroup>
          <Box sx={{ flex: 1 }} />
          <IconButton><ViewListIcon /></IconButton>
          <IconButton><SyncIcon /></IconButton>
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
                  onClick={() => navigate(`/email/${mail.emailId}`)}
                >
                  <TableCell padding="checkbox"><Checkbox size="small" /></TableCell>
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
                    {/* 받는사람 메일주소 (TO) 명확하게 출력 */}
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