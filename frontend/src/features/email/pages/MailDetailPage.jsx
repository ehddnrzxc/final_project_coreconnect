import React, { useEffect, useState } from 'react';
import { getEmailDetail, downloadAttachment, markMailAsRead } from '../api/emailApi';
import {
  Box, Typography, Divider, Paper, IconButton, Chip, Tooltip, Button
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReplyIcon from '@mui/icons-material/Reply';
import ForwardIcon from '@mui/icons-material/Forward';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ReportIcon from '@mui/icons-material/Report';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import useUserEmail from '../hook/useUserEmail'; // ⭐️ 여기 추가

// 파일 사이즈 변환
function formatBytes(bytes) {
  if (isNaN(bytes) || !bytes) return '-';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return +(bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
}

function MailDetailPage() {
  const { emailId } = useParams();
  const navigate = useNavigate();
  const [mailDetail, setMailDetail] = useState(null);
  const { refreshUnreadCount } = useOutletContext();
  const userEmail = useUserEmail(); // ⭐️ 훅으로 교체!

  
  useEffect(() => {
  if (!emailId || !userEmail) return;

  getEmailDetail(emailId, userEmail).then(res => {
    const data = res.data.data;
    setMailDetail(data);

    if (data.readYn === false) {
      markMailAsRead(emailId, userEmail)
        .then(() => {
          if (refreshUnreadCount) refreshUnreadCount(); // ★여기!
        });
    }
  });
}, [emailId, userEmail, refreshUnreadCount]);


  if (!mailDetail) return <div>Loading...</div>;

  const handleDownload = (fileId, fileName) => {
    downloadAttachment(fileId, fileName);
  };

  return (
    <Box sx={{ p: 4, minHeight: "100vh", bgcolor: "#f8fafb" }}>
      {/* 상단 액션 버튼 */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: "center", justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="뒤로가기"><IconButton onClick={() => navigate(-1)}><ArrowBackIcon /></IconButton></Tooltip>
          <Tooltip title="스팸신고"><IconButton color="inherit"><ReportIcon /></IconButton></Tooltip>
          <Tooltip title="답장"><IconButton color="inherit"><ReplyIcon /></IconButton></Tooltip>
          <Tooltip title="전달"><IconButton color="inherit"><ForwardIcon /></IconButton></Tooltip>
          <Tooltip title="삭제"><IconButton color="inherit"><DeleteIcon /></IconButton></Tooltip>
          <Tooltip title="중요 표시"><IconButton color="warning"><StarIcon /></IconButton></Tooltip>
        </Box>
        <Box>
          <Tooltip title="더보기"><IconButton><MoreVertIcon /></IconButton></Tooltip>
        </Box>
      </Box>
      <Paper elevation={0} sx={{ p: 4, borderRadius: 2, maxWidth: 900, mx: "auto", mb: 2, boxShadow: 2 }}>
        {/* 제목, 상태, 중요표시 */}
        <Box sx={{ pb: 1, mb: 2, borderBottom: "1px solid #ececec", display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>{mailDetail.emailTitle}</Typography>
          {mailDetail.emailStatus && (
            <Chip
              label={mailDetail.emailStatus}
              color={mailDetail.emailStatus === "SENT" ? "success" : mailDetail.emailStatus === "FAILED" ? "error" : "default"}
              size="small"
              sx={{ fontWeight: 500 }}
            />
          )}
          {mailDetail.favoriteStatus && (
            <StarIcon sx={{ color: "#f1ac00", ml: 1 }} fontSize="small" />
          )}
        </Box>
        {/* 송신자/수신자 블록 */}
        <Box sx={{ display: 'flex', alignItems: "center", gap: 2, mb: 1, flexWrap: "wrap" }}>
          <Typography fontWeight={600} fontSize={15}>보낸사람:</Typography>
          <Chip
            color="info"
            label={`${mailDetail.senderEmail || '-'}${mailDetail.senderDept ? ' / ' + mailDetail.senderDept : ''}`}
            size="small"
            sx={{ mr: 1, fontWeight: 500 }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: "center", flexWrap: "wrap", gap: 2, mb: 1 }}>
          <Typography fontWeight={600} fontSize={15}>받는사람:</Typography>
          {(mailDetail.toRecipients || []).map(r => (
            <Chip
              label={`${r.emailRecipientAddress}${r.userDept ? ' / ' + r.userDept : ''}`}
              key={r.emailRecipientId}
              size="small"
              sx={{ mr: 1 }}
            />
          ))}
        </Box>
        {(mailDetail.ccRecipients || []).length > 0 && (
          <Box sx={{ display: 'flex', alignItems: "center", flexWrap: "wrap", gap: 2, mb: 1 }}>
            <Typography color="textSecondary" fontSize={15}>참조:</Typography>
            {mailDetail.ccRecipients.map(r =>
              <Chip
                label={`${r.emailRecipientAddress}${r.userDept ? ' / ' + r.userDept : ''}`}
                key={r.emailRecipientId}
                size="small"
                variant="outlined"
                sx={{ mr: 1, color: "#90b2cc" }}
              />
            )}
          </Box>
        )}
        {(mailDetail.bccRecipients || []).length > 0 && (
          <Box sx={{ display: 'flex', alignItems: "center", flexWrap: "wrap", gap: 2, mb: 1 }}>
            <Typography color="textSecondary" fontSize={15}>숨은참조:</Typography>
            {mailDetail.bccRecipients.map(r =>
              <Chip
                label={`${r.emailRecipientAddress}${r.userDept ? ' / ' + r.userDept : ''}`}
                key={r.emailRecipientId}
                size="small"
                variant="outlined"
                sx={{ mr: 1, color: "#b09dcc" }}
              />
            )}
          </Box>
        )}
        {/* 보낸 날짜 라인 */}
        <Box sx={{ mt: 0.5, mb: 2, color: "#777", fontSize: 14 }}>
          보낸날짜: {mailDetail.sentTime ? (typeof mailDetail.sentTime === "string" ? new Date(mailDetail.sentTime).toLocaleString() : mailDetail.sentTime) : "-"}
        </Box>
        {/* === 첨부파일 영역 (파일명 표시/다운로드) === */}
        {(mailDetail.attachments && mailDetail.attachments.length > 0) && (
          <Box sx={{
            width: "100%",
            mt: 2, mb: 2, bgcolor: "#f6faff", borderRadius: 1,
            py: 1.2, border: "1px solid #e2ecfa"
          }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1, px: 2 }}>
              <AttachFileIcon sx={{ color: "#7da8e3", mr: 1 }} />
              <Typography fontWeight={600} fontSize={15}>
                첨부파일 {mailDetail.attachments.length}개
              </Typography>
            </Box>
            <Box sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              width: "100%",
              px: 2
            }}>
              {mailDetail.attachments.map(file => (
                <Chip
                  icon={<AttachFileIcon />}
                  label={`${file.fileName} (${formatBytes(file.fileSize)})`}
                  onClick={() => handleDownload(file.fileId, file.fileName)}
                  clickable
                  key={file.fileId}
                  sx={{
                    mr: 1,
                    px: 1.8,
                    py: 1.1,
                    fontWeight: 500,
                    bgcolor: "#f4f6fa",
                    borderRadius: "6px",
                    fontSize: "15px"
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
        <Divider sx={{ my: 2 }} />
        <Box sx={{
          minHeight: 120,
          bgcolor: "#f3f3f3",
          borderRadius: 1,
          p: 3,
          fontSize: 15,
          lineHeight: 1.7,
          mb: 2,
          whiteSpace: "pre-wrap",
          border: "1px solid #efefef"
        }}>
          {mailDetail.emailContent}
        </Box>
      </Paper>
    </Box>
  );
}

export default MailDetailPage;