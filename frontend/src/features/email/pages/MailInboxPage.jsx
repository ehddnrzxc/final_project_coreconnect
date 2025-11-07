import React from 'react';
import { Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, ButtonGroup, Button, InputBase, Divider, Checkbox, Chip, Pagination
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

const mails = [
  {
    id: 1,
    sender: '권시정',
    title: '[전사 게시글 등록] aaaaa글이 등록되었습니다.',
    date: '25-11-05 12:20',
    size: '5.0KB',
    status: '',
  },
];

const oldMails = [
  {
    id: 5,
    sender: '김인재',
    title: '[결재 취소][견적 포함] 임시직 부장(이)가 작성한 휴가신청(이)가 취소되었습니다.',
    date: '25-09-08 18:14',
    size: '5.4KB',
    status: ''
  },
];

const MailInboxPage = () => {
  const [search, setSearch] = React.useState('');
  console.log("### [MailInboxPage] 렌더링됨");


  return (
    <Box sx={{ p: 4, minHeight: "100vh", bgcolor: "#fafbfd" }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
        {/* 상단 타이틀 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>받은메일함</Typography>
          <Typography sx={{ ml: 2, color: 'text.secondary', fontSize: 15 }}>
            전체메일 <b>97</b> / 안읽은 메일 <b>18</b>
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
            <Typography sx={{ px: 0.5, fontWeight: 500, fontSize: 15 }}>20</Typography>
            <IconButton size="small"><MoreVertIcon fontSize="small" /></IconButton>
          </Paper>
        </Box>

        {/* 메일 테이블 섹션 */}
        <Divider sx={{ mb: 2 }} />
        <Table sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafd", borderBottom: '2px solid #e1e3ea' }}>
              <TableCell padding="checkbox"></TableCell>
              <TableCell sx={{ fontWeight: 700 }}>발신자</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>제목</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>일자</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>크기</TableCell>
              <TableCell sx={{ fontWeight: 700 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* 최근 메일들 */}
            <TableRow>
              <TableCell colSpan={6} sx={{ bgcolor: '#fafbfd', fontWeight: 700, fontSize: 15 }}>
                2025-11-05 (수)
              </TableCell>
            </TableRow>
            {mails.map(mail => (
              <TableRow key={mail.id} hover>
                <TableCell padding="checkbox"><Checkbox size="small" /></TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{mail.sender}</TableCell>
                <TableCell>{mail.title}</TableCell>
                <TableCell>{mail.date}</TableCell>
                <TableCell align="right">{mail.size}</TableCell>
                <TableCell><IconButton size="small"><VisibilityIcon fontSize="small" /></IconButton></TableCell>
              </TableRow>
            ))}
            {/* 섹션 구분: 과거/오래된 항목 */}
            <TableRow>
              <TableCell colSpan={6} sx={{ bgcolor: '#fafbfd', color: '#9bc1e0', fontWeight: 600 }}>오래된 항목</TableCell>
            </TableRow>
            {oldMails.map(mail => (
              <TableRow key={mail.id} hover>
                <TableCell padding="checkbox"><Checkbox size="small" /></TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{mail.sender}</TableCell>
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

export default MailInboxPage;