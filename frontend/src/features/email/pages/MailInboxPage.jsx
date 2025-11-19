import React, { useEffect, useState, useContext } from 'react';
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
import SyncIcon from '@mui/icons-material/Sync';
import ViewListIcon from '@mui/icons-material/ViewList';
import { fetchInbox, fetchUnreadCount, moveToTrash, markMailAsRead } from '../api/emailApi'; // ※ moveToTrash로 변경! (휴지통 이동)
import { useNavigate, useLocation } from 'react-router-dom';
import useUserEmail from '../../email/hook/useUserEmail'; // 사용자 이메일 추출 훅
import { MailCountContext } from "../../../App"; // 메일 카운트 컨텍스트(사이드바 등 공유)
import { UserProfileContext } from "../../../App";

const MailInboxPage = () => {
  // 상태변수 선언
  const [tab, setTab] = useState("all"); // 전체/오늘/안읽음
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [mails, setMails] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0); // Chip/Badge
  const [selected, setSelected] = useState(new Set());
  const [snack, setSnack] = useState({ open: false, severity: 'info', message: '' });
  const { userProfile } = useContext(UserProfileContext) || {};
  const userEmail = userProfile?.email;
  const navigate = useNavigate();
  const location = useLocation();
  const mailCountContext = useContext(MailCountContext);

  // 쿼리파라미터에 따라 탭 상태 반영
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabQuery = searchParams.get('tab');
    if (tabQuery && ["all", "today", "unread"].includes(tabQuery) && tab !== tabQuery) {
      setTab(tabQuery);
    }
  }, [location.search, tab]);

  // 메일상태 라벨/칼라 변환
  const formatMailStatusLabel = (status) => {
    switch (status) {
      case "SENT": return "전송완료";
      case "TRASH": return "휴지통";
      case "DELETED": return "삭제됨";
      default: return status || "-";
    }
  };
  const formatMailStatusColor = (status) => {
    switch (status) {
      case "SENT": return "success";
      case "TRASH": return "warning";
      case "DELETED": return "error";
      default: return "default";
    }
  };

  // 받은메일함 목록 로딩
  const loadInbox = async (pageIdx = page, pageSize = size, activeTab = tab) => {
    if (!userEmail) return;
    try {
      // 서버에서 삭제된 메일이 제외되어 반환됨(DB/JPQL 필터)
      const res = await fetchInbox(userEmail, pageIdx - 1, pageSize, activeTab === "all" ? null : activeTab);
      const boxData = res?.data?.data;
      const mailList = Array.isArray(boxData?.content) ? boxData.content : [];
      setMails(mailList);
      setTotal(typeof boxData?.totalElements === "number" ? boxData.totalElements : 0);
      setSelected(prev => {
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

  // 탭/페이지 등 변경시 메일함 새로고침
  useEffect(() => {
    loadInbox();
    // eslint-disable-next-line
  }, [userEmail, page, size, tab]);

  // 안읽은 개수 fetch + 컨텍스트 연동
  const loadUnreadCount = async () => {
    if (!userEmail) return;
    fetchUnreadCount(userEmail)
      .then(count => {
        setUnreadCount(count || 0);
        if (mailCountContext?.refreshUnreadCount) mailCountContext.refreshUnreadCount(count || 0);
      })
      .catch(() => {
        setUnreadCount(0);
        if (mailCountContext?.refreshUnreadCount) mailCountContext.refreshUnreadCount(0);
      });
  };
  useEffect(() => {
    loadUnreadCount();
  }, [userEmail]);

  // 개별 행 선택/토글
  const toggleSelect = (mailId) => {
    setSelected(prev => {
      const s = new Set(prev);
      if (s.has(mailId)) s.delete(mailId);
      else s.add(mailId);
      return s;
    });
  };

  // 전체선택/해제 토글
  const toggleSelectAll = () => {
    setSelected(prev => {
      const idsOnPage = mails.map(m => m.emailId);
      const allSelected = idsOnPage.every(id => prev.has(id));
      if (allSelected) {
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

  // 선택된 메일들 휴지통 이동 (moveToTrash 호출)
  const deleteSelected = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      setSnack({ open: true, severity: 'warning', message: '삭제할 메일을 선택하세요.' });
      return;
    }
    if (!window.confirm(`선택한 ${ids.length}개의 메일을 휴지통으로 이동하시겠습니까?`)) return;

    try {
      await moveToTrash(ids); // 휴지통으로 이동! (영구삭제 아님)
      setSnack({ open: true, severity: 'success', message: `${ids.length}개의 메일을 휴지통으로 이동했습니다.` });
      setSelected(prev => {
        const s = new Set(prev);
        ids.forEach(id => s.delete(id));
        return s;
      });
      await loadInbox();      // 새로고침: 이동한 항목 즉시 사라짐
      await loadUnreadCount();// 언리드카운트까지 새로고침
    } catch (err) {
      console.error('deleteSelected error', err);
      setSnack({ open: true, severity: 'error', message: '메일 삭제(휴지통 이동) 중 오류가 발생했습니다.' });
    }
  };

  // 날짜 포맷 (YYYY-MM-DD HH시 mm분 ss초)
  const formatSentTime = (sentTime) => {
    if (!sentTime) return '-';
    try {
      const d = (typeof sentTime === "string" || typeof sentTime === "number") ? new Date(sentTime) : sentTime;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const HH = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd} ${HH}시 ${mi}분 ${ss}초`;
    } catch {
      return '-';
    }
  };

  // 메일 행 클릭(읽음처리 + 상세진입)
  const handleMailRowClick = async (mail) => {
    try {
      if (mail.emailReadYn === false) {
        await markMailAsRead(mail.emailId, userEmail); // 읽음 처리
        await loadUnreadCount();
      }
      navigate(`/email/${mail.emailId}`);   // 상세 페이지 이동
    } catch (err) {
      setSnack({ open: true, severity: 'error', message: "메일 읽음처리 중 오류" });
      navigate(`/email/${mail.emailId}`);
    }
  };

  // 렌더링
  return (
    <Box sx={{ p: 4, minHeight: "100vh", bgcolor: "#fafbfd" }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
        {/* 상단 타이틀 및 탭/Chip */}
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
        </Box>

        {/* 탭 구역 */}
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

        {/* 상단 툴바(삭제, 등) */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {/* 전체선택 */}
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
            {/* 삭제(휴지통 이동) */}
            <Button startIcon={<DeleteIcon />} onClick={deleteSelected}>삭제</Button>
            <Button startIcon={<TagIcon />}>태그</Button>
            <Button startIcon={<ForwardIcon />}>전달</Button>
            <Button startIcon={<MarkEmailReadIcon />}>읽음</Button>
            <Button startIcon={<MoveToInboxIcon />}>이동</Button>
            <Button startIcon={<MoreVertIcon />}>이메일옵션</Button>
          </ButtonGroup>
          <Box sx={{ flex: 1 }} />
          <IconButton><ViewListIcon /></IconButton>
          <IconButton><SyncIcon onClick={() => { loadInbox(1, size, tab); loadUnreadCount(); }} /></IconButton>
          <IconButton><MoreVertIcon /></IconButton>
          <Paper sx={{ ml: 1, display: 'inline-flex', alignItems: 'center', px: 0.5 }}>
            <Typography sx={{ px: 0.5, fontWeight: 500, fontSize: 15 }}>{size}</Typography>
            <IconButton size="small"><MoreVertIcon fontSize="small" /></IconButton>
          </Paper>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {/* 메일 테이블 */}
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
            {/* 메일이 없을 때 안내 */}
            {Array.isArray(mails) && mails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">받은 메일이 없습니다.</TableCell>
              </TableRow>
            ) : (
              mails.map(mail => {
                const id = mail.emailId;
                const checked = selected.has(id);
                // 안읽음 처리 (fontWeight, bg)
                const isUnread = mail.emailReadYn === false || typeof mail.emailReadYn === "undefined";
                return (
                  <TableRow
                    key={id}
                    hover
                    sx={{
                      cursor: "pointer",
                      fontWeight: isUnread ? 700 : 400,
                      background: isUnread ? "#fff4f4" : undefined
                    }}
                    onClick={() => handleMailRowClick(mail)}
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
                        label={formatMailStatusLabel(mail.emailStatus)}
                        color={formatMailStatusColor(mail.emailStatus)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {/* (눈 아이콘 삭제) ※ */}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        {/* 하단 페이징 */}
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <Pagination
            count={Math.max(1, Math.ceil(total / size))}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      </Paper>
      {/* 알림 Snackbar */}
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