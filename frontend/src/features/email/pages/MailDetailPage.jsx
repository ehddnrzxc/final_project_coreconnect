import React, { useEffect, useState } from 'react';
import { getEmailDetail, downloadAttachment } from '../api/emailApi';
import { Box, Typography, Chip } from '@mui/material';

function MailDetailPage({ emailId }) {
  const [mailDetail, setMailDetail] = useState(null);

  useEffect(() => {
    getEmailDetail(emailId).then(res => setMailDetail(res.data.data));
  }, [emailId]);

  if (!mailDetail) return <div>Loading...</div>;
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5">{mailDetail.emailTitle}</Typography>
      <Box>발신자: {mailDetail.senderName || mailDetail.senderId}</Box>
      <Box>수신자: {(mailDetail.recipientAddresses || []).join(', ')}</Box>
      <Box>참조: {(mailDetail.ccAddresses || []).join(', ')}</Box>
      <Box>숨은참조: {(mailDetail.bccAddresses || []).join(', ')}</Box>
      <Box>보낸날짜: {mailDetail.sentTime}</Box>
      <Box>내용: {mailDetail.emailContent}</Box>
      <Box sx={{ mt: 2 }}>
        {mailDetail.fileIds && mailDetail.fileIds.map(fileId => (
          <Chip
            label={`첨부파일 #${fileId}`}
            onClick={() => downloadAttachment(fileId)}
            clickable
            key={fileId}
            sx={{ mr: 1 }}
          />
        ))}
      </Box>
    </Box>
  );
}

export default MailDetailPage;