import React, { useEffect, useState, useContext } from 'react';
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
import SyncIcon from '@mui/icons-material/Sync';
import ViewListIcon from '@mui/icons-material/ViewList';
import DraftsIcon from '@mui/icons-material/Drafts';

import { fetchSentbox, moveToTrash } from '../api/emailApi';
import { useNavigate } from 'react-router-dom';
import { UserProfileContext } from '../../../App';

/*
  상태에 따라 라벨 한글 변환 함수 (메일 상태 표시에 사용)
*/
function getStatusLabel(emailStatus) {
  if (emailStatus === "SENT") return "발신완료";
  if (emailStatus === "FAILED" || emailStatus === "FAIL" || emailStatus === "BOUNCE") return "발신실패";
  if (emailStatus === "TRASH") return "휴지통";
  if (emailStatus === "DELETED") return "삭제됨";
  return emailStatus;
}

/*
  상태에 따라 칩 색상 결정 함수 (메일 상태 표시에 사용)
*/
function getStatusColor(emailStatus) {
  if (emailStatus === "SENT") return "success";
  if (emailStatus === "FAILED" || emailStatus === "FAIL" || emailStatus === "BOUNCE") return "error";
  if (emailStatus === "TRASH") return "warning";
  if (emailStatus === "DELETED") return "default";
  return "default";
}

/*
  보낸메일함 페이지 컴포넌트
  - 보낸 메일 목록 조회, 삭제, 페이징, 메일 정보 표시, 선택 등 담당
*/
const MailSentBoxPage = () => {
  // UserProfileContext에서 userProfile을 가져와 이메일을 추출
  const context = useContext(UserProfileContext);
  const userEmail = context?.userProfile?.email || null;

  // 디버깅 로그: Context와 userEmail 체크
  console.log("MailSentBoxPage context:", context);
  console.log("MailSentBoxPage userEmail:", userEmail);

  // 상태 정의: 메일 목록, 페이징, 선택 등
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [size] = useState(9);
  const [total, setTotal] = useState(0);
  const [mails, setMails] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const navigate = useNavigate();

  /*
    보낸 메일 목록을 서버에서 조회하는 함수 (userEmail, page, size 기준)
  */
  const load = () => {
    if (!userEmail) {
      // userEmail이 없으면 리스트를 클리어 및 중단
      console.log("No userEmail, skipping fetchSentbox");
      setTotal(0); setMails([]);
      return;
    }

    // 디버깅 로그: API 요청 직전 파라미터 확인
    console.log("fetchSentbox() called with:", userEmail, page, size);

    fetchSentbox(userEmail, page - 1, size)
      .then(res => {
        // 응답 전체를 출력하여 구조 확인
        console.log('fetchSentbox response:', res);
        const boxData = res?.data?.data;
        const mailList = Array.isArray(boxData?.content) ? boxData.content : [];
        setMails(mailList);
        setTotal(typeof boxData?.totalElements === "number" ? boxData.totalElements : 0);
      })
      .catch(err => {
        setMails([]);
        setTotal(0);
        console.error("fetchSentbox error", err);
      });
  };

  // page, size, userEmail 바뀔 때마다 메일 목록 새로고침
  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [page, size, userEmail]);

  /*
    메일 행 선택/해제용 핸들러
    id: 선택/해제할 이메일의 emailId
  */
  const toggleSelect = (id) => {
    setSelected(prev => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id); else copy.add(id);
      return copy;
    });
  };

  /*
    여러 메일을 휴지통(삭제) 처리
    - 체크박스 선택 후 삭제 버튼 클릭 시 동작
  */
  const handleDeleteSelected = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      alert("삭제할 메일을 선택하세요.");
      return;
    }
    if (!window.confirm(`선택한 ${ids.length}개의 메일을 휴지통으로 이동하시겠습니까?`)) return;
    
    try {
      await moveToTrash(ids);
      alert(`${ids.length}개의 메일을 휴지통으로 이동했습니다.`);
      setSelected(new Set());
      // 목록 새로고침하여 이동한 항목 즉시 사라지게 함
      load();
    } catch (e) {
      console.error("handleDeleteSelected error:", e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 전체 행이 선택됐는지(체크박스UI용)
  const allChecked = mails.length > 0 && selected.size === mails.length;
  // indeterminate(선택 일부만, 전체X, 0개X)
  const isIndeterminate = selected.size > 0 && selected.size < mails.length;

  /*
    렌더링 부분: 메일함 타이틀 + 도구 + 메일 테이블 + 페이지네이션
  */
  return (
    <Box sx={{ p: 4, bgcolor: "#fafbfd", minHeight: "100vh" }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
        {/* 상단 타이틀 및 툴바 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>보낸메일함</Typography>
          <Typography sx={{ ml: 2, color: 'text.secondary', fontSize: 15 }}>
            전체메일 <b>{total}</b>
          </Typography>
          <Box sx={{ flex: 1 }} />
          {/* 검색창 */}
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
        </Box>

        {/* 툴바 버튼들 */}
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

        {/* 메일 목록 테이블 */}
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
                    {/* 눈모양 아이콘(상세보기) 제거됨 */}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* 페이지네이션 */}
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