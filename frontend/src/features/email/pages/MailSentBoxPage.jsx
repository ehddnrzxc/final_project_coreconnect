import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, 
  IconButton, ButtonGroup, Button, InputBase, Divider, Checkbox, Chip, Pagination 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
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
import DraftsIcon from '@mui/icons-material/Drafts';

import { fetchSentbox, moveToTrash } from '../api/emailApi';
import { useNavigate } from 'react-router-dom';

function getUserEmailFromStorage() {
  const userString = localStorage.getItem("user");
  if (!userString) return null;
  try {
    const userObj = JSON.parse(userString);
    return userObj.email || null;
  } catch {
    return null;
  }
}

// 상태에 따라 라벨 한글 변환 함수
function getStatusLabel(emailStatus) {
  if (emailStatus === "SENT") return "발신완료";
  if (emailStatus === "FAILED" || emailStatus === "FAIL" || emailStatus === "BOUNCE") return "발신실패";
  if (emailStatus === "TRASH") return "휴지통";
  if (emailStatus === "DELETED") return "삭제됨";
  // 그 외 상태는 원문 노출
  return emailStatus;
}
// 상태에 따라 칩 색상 결정 함수
function getStatusColor(emailStatus) {
  if (emailStatus === "SENT") return "success";
  if (emailStatus === "FAILED" || emailStatus === "FAIL" || emailStatus === "BOUNCE") return "error";
  if (emailStatus === "TRASH") return "warning";
  if (emailStatus === "DELETED") return "default";
  return "default";
}

const MailSentBoxPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(9);
  const [total, setTotal] = useState(0);
  const [mails, setMails] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const navigate = useNavigate();

  const load = () => {
    fetchSentbox(page - 1, size)
      .then(res => {
        const boxData = res?.data?.data;
        const mailList = Array.isArray(boxData?.content) ? boxData.content : [];
        setMails(mailList);
        setTotal(typeof boxData?.totalElements === "number" ? boxData.totalElements : 0);
      })
      .catch(err => {
        setMails([]);
        setTotal(0);
      });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [page, size]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id); else copy.add(id);
      return copy;
    });
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return alert("삭제할 메일을 선택하세요.");
    if (!window.confirm("선택한 메일을 휴지통으로 이동하시겠습니까?")) return;
    try {
      const ids = Array.from(selected);
      await moveToTrash(ids);
      setSelected(new Set());
      load();
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 전체 선택/해제
  const allChecked = mails.length > 0 && selected.size === mails.length;
  const isIndeterminate = selected.size > 0 && selected.size < mails.length;

  return (
    <Box sx={{ p: 4, bgcolor: "#fafbfd", minHeight: "100vh" }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
        {/* 상단 타이틀 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>보낸메일함</Typography>
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
              bgcolor: "#f8fafb",
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
        {/* 상단 툴바 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 2 }}>
          <ButtonGroup variant="text" sx={{ gap: 1 }}>
            <Button startIcon={<ReplyIcon />}>답장</Button>
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
          <IconButton><DraftsIcon /></IconButton>
          <Paper sx={{ ml: 1, display: "inline-flex", alignItems: "center", px: 0.5 }}>
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
                    if (e.target.checked) {
                      setSelected(new Set(mails.map(m => m.emailId)));
                    } else {
                      setSelected(new Set());
                    }
                  }} 
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>수신자</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>제목</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>일자</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>상태</TableCell>
              <TableCell sx={{ fontWeight: 700 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(Array.isArray(mails) && mails.length === 0) ? (
              <TableRow>
                <TableCell colSpan={6} align="center">보낸 메일이 없습니다.</TableCell>
              </TableRow>
            ) : (
              mails.map((mail) => (
                <TableRow
                  key={mail.emailId}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => navigate(`/email/${mail.emailId}`)}
                >
                  <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      size="small"
                      checked={selected.has(mail.emailId)}
                      onChange={() => toggleSelect(mail.emailId)}
                    />
                  </TableCell>
                  <TableCell>
                    {(mail.recipientAddresses || []).join(", ") || "-"}
                    {mail.ccAddresses && mail.ccAddresses.length > 0 && (
                      <>
                        <br />
                        <span style={{ color: '#90b2cc', fontSize: 12 }}>cc: {mail.ccAddresses.join(", ")}</span>
                      </>
                    )}
                    {mail.bccAddresses && mail.bccAddresses.length > 0 && (
                      <>
                        <br />
                        <span style={{ color: '#b09dcc', fontSize: 12 }}>bcc: {mail.bccAddresses.join(", ")}</span>
                      </>
                    )}
                  </TableCell>
                  <TableCell>
                    {mail.emailTitle}
                    {mail.fileIds && mail.fileIds.length > 0 && (
                      <Chip label={`첨부 ${mail.fileIds.length}개`} size="small" color="info" sx={{ ml: 1 }} />
                    )}
                  </TableCell>
                  <TableCell>
                    {mail.sentTime ? new Date(mail.sentTime).toLocaleString() : "-"}
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={getStatusLabel(mail.emailStatus)}
                      color={getStatusColor(mail.emailStatus)}
                      size="small"
                    />
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

export default MailSentBoxPage;