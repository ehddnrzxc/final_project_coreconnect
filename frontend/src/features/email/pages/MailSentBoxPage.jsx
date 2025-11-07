import React, { useState } from 'react';
import { Box } from '@mui/material';
import {
 
  Typography,
  Paper,
  Table, TableHead, TableBody, TableRow, TableCell,
  IconButton,
  ButtonGroup,
  Button,
  InputBase,
  Divider,
  Checkbox,
  Chip,
  Pagination
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
import SendIcon from '@mui/icons-material/Send';

const sentMailsRecent = [
  {
    id: 1,
    receiver: 'dkji@hblaser.co.kr',
    title: 'test',
    date: '25-10-23 17:28',
    size: '7.0MB',
  }
];

const sentMailsOld = [
  { id: 2, receiver: '김인재', title: 'Re: 부사장 ㅎㅎ', date: '25-09-24 17:45', size: '4.7KB' },
  { id: 3, receiver: '김인재', title: 'Re: 부사장 ㅎㅎ', date: '25-09-24 14:48', size: '3.3KB' },
  { id: 4, receiver: 'adminwoo@o00xe...', title: '서명 테스트', date: '25-09-03 14:13', size: '1.4KB' },
  { id: 5, receiver: '김인재', title: 'ㅇㅇㅇ', date: '25-09-03 13:54', size: '10170Byte' },
  { id: 6, receiver: '강희계', title: '아웃룩 메일저장공간 문제관련', date: '25-09-01 17:36', size: '1.1KB' },
  { id: 7, receiver: 'ikissme@guyong...', title: '다우 오피스 메일 테스트', date: '25-08-08 15:49', size: '21.8KB' },
  { id: 8, receiver: 'ikissme@guyong...', title: '다우 오피스 메일 테스트', date: '25-08-08 15:38', size: '22.3KB' },
  { id: 9, receiver: '강희계', title: 'Re: 워크샵 기기실상황', date: '25-07-21 18:25', size: '3.7KB' },
  { id: 10, receiver: '강희계', title: '워크샵 기기실상황', date: '25-07-21 18:25', size: '1.1KB' },
  { id: 11, receiver: '김인재', title: 'Re:ㅇㅅㄱ', date: '25-07-21 17:57', size: '4.2KB' },
  { id: 12, receiver: '강희계', title: '너에게 메일 보내기 테스트', date: '25-06-24 09:21', size: '1.1KB' },
];

const MailSentBoxPage = () => {
  const [search, setSearch] = useState('');

  return (
    <Box sx={{ p: 4, bgcolor: "#fafbfd", minHeight: "100vh" }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
        {/* 상단 타이틀 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>보낸메일함</Typography>
          <Typography sx={{ ml: 2, color: 'text.secondary', fontSize: 15 }}>
            전체메일 <b>12</b> / 안읽은 메일 <b>0</b>
          </Typography>
          <Box sx={{ flex: 1 }} />
          {/* 검색창/환경설정 */}
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
            }}>
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
          <IconButton><DraftsIcon /></IconButton>
          <Paper sx={{ ml: 1, display: "inline-flex", alignItems: "center", px: 0.5 }}>
            <Typography sx={{ px: 0.5, fontWeight: 500, fontSize: 15 }}>20</Typography>
            <IconButton size="small"><MoreVertIcon fontSize="small" /></IconButton>
          </Paper>
        </Box>

        {/* 메일 테이블 */}
        <Divider sx={{ mb: 2 }} />
        <Table sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafd", borderBottom: '2px solid #e1e3ea' }}>
              <TableCell padding="checkbox"></TableCell>
              <TableCell sx={{ fontWeight: 700 }}>수신자</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>제목</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>일자</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>크기</TableCell>
              <TableCell sx={{ fontWeight: 700 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* 2주전 */}
            <TableRow>
              <TableCell colSpan={6} sx={{ bgcolor: "#fafbfd", fontWeight: 700, fontSize: 15 }}>
                2주전
              </TableCell>
            </TableRow>
            {sentMailsRecent.map(mail => (
              <TableRow key={mail.id} hover>
                <TableCell padding="checkbox"><Checkbox size="small" /></TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{mail.receiver}</TableCell>
                <TableCell>{mail.title}</TableCell>
                <TableCell>{mail.date}</TableCell>
                <TableCell align="right">{mail.size}</TableCell>
                <TableCell><IconButton size="small"><VisibilityIcon fontSize="small" /></IconButton></TableCell>
              </TableRow>
            ))}

            {/* 오래된 항목 */}
            <TableRow>
              <TableCell colSpan={6} sx={{ bgcolor: "#fafbfd", color: "#9bc1e0", fontWeight: 600 }}>
                오래된 항목
              </TableCell>
            </TableRow>
            {sentMailsOld.map(mail => (
              <TableRow key={mail.id} hover>
                <TableCell padding="checkbox"><Checkbox size="small" /></TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{mail.receiver}</TableCell>
                <TableCell>{mail.title}</TableCell>
                <TableCell>{mail.date}</TableCell>
                <TableCell align="right">{mail.size}</TableCell>
                <TableCell><IconButton size="small"><VisibilityIcon fontSize="small" /></IconButton></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* 테이블 하단 페이지네이션 */}
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <Pagination count={5} page={1} color="primary" />
        </Box>
      </Paper>
    </Box>
  );
};

export default MailSentBoxPage;