import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Button, Checkbox, Chip, Pagination
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import RestoreFromTrashIcon from "@mui/icons-material/RestoreFromTrash";
import { useNavigate } from "react-router-dom";
import { getUserEmailFromStorage, moveToTrash, emptyTrash } from "../api/emailApi";

const MailTrashPage = () => {
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [total, setTotal] = useState(0);
  const [mails, setMails] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const userEmail = getUserEmailFromStorage();
  const navigate = useNavigate();

  // 휴지통 리스트 불러오기
  const load = () => {
    fetchTrashList(userEmail, page - 1, size)
      .then(res => {
        const boxData = res?.data?.data;
        const mailList = Array.isArray(boxData?.content) ? boxData.content : [];
        setMails(mailList);
        setTotal(typeof boxData?.totalElements === "number" ? boxData.totalElements : 0);
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
  }, [page, size]);

  // 휴지통 비우기
  const handleEmptyTrash = async () => {
    if (!window.confirm("휴지통을 완전히 비우시겠습니까?")) return;
    try {
      await emptyTrash();
      load();
    } catch (err) {
      alert("휴지통 비우기 중 오류가 발생했습니다.");
      console.error(err);
    }
  };

  // 전체선택/해제
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
            variant="contained"
            color="error"
            size="small"
            startIcon={<DeleteForeverIcon />}
            onClick={handleEmptyTrash}
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
            {Array.isArray(mails) && mails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">휴지통에 메일이 없습니다.</TableCell>
              </TableRow>
            ) : (
              mails.map(mail => (
                <TableRow
                  key={mail.emailId}
                  hover
                  sx={{ cursor: "pointer" }}
                >
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
                    {mail.emailStatus}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={e => { e.stopPropagation(); navigate(`/email/${mail.emailId}`); }}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    {/* 복구 버튼 필요 시 <IconButton size="small" color="primary"><RestoreFromTrashIcon/></IconButton> */}
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

export default MailTrashPage;