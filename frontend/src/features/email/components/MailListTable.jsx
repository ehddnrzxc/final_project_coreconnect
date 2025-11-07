import React from 'react';
// MUI 컴포넌트(테이블, 아이콘 버튼 등) 임포트
import { Table, TableHead, TableBody, TableRow, TableCell, IconButton } from '@mui/material';
// MUI 아이콘(상세보기 버튼용)
import VisibilityIcon from '@mui/icons-material/Visibility';

// 함수 표현식으로 컴포넌트 선언
const MailListTable = ({ mails, onSelectDetail }) => {
  // 받은 mails 배열을 테이블로 렌더링
  return (
    <Table>
      {/* 테이블 헤더 부분 */}
      <TableHead>
        <TableRow>
          <TableCell>상태</TableCell>            {/* 메일 상태(발송/실패 등) */}
          <TableCell>제목</TableCell>            {/* 메일 제목 */}
          <TableCell>발신자</TableCell>          {/* 발신자 이름 or ID */}
          <TableCell>수신자</TableCell>          {/* 수신자 주소(배열, 콤마구분) */}
          <TableCell>날짜</TableCell>            {/* 발송 일자/시간 */}
          <TableCell>첨부파일</TableCell>        {/* 첨부파일 개수 */}
          <TableCell>상세</TableCell>            {/* 상세보기 아이콘 버튼 */}
        </TableRow>
      </TableHead>
      {/* 모든 메일 목록을 테이블 바디에 렌더 */}
      <TableBody>
        {mails.map(mail => (
          <TableRow key={mail.emailId} hover> {/* 행별 메일 ID 유니크 키, hover 효과 */}
            <TableCell>{mail.emailStatus}</TableCell>                        {/* 메일 상태 표시 */}
            <TableCell>{mail.emailTitle}</TableCell>                        {/* 제목 표시 */}
            <TableCell>{mail.senderName || mail.senderId}</TableCell>       {/* 발신자명(없으면 발신자ID) */}
            <TableCell>{(mail.recipientAddresses || []).join(', ')}</TableCell> {/* 수신자 목록 */}
            <TableCell>{mail.sentTime}</TableCell>                          {/* 보낸 시간 */}
            <TableCell>{mail.fileIds ? mail.fileIds.length : 0}</TableCell> 
            <TableCell>
              {/* 상세보기 버튼 클릭시 상세페이지로 이동 or 상세함수 실행 */}
              <IconButton onClick={() => onSelectDetail?.(mail.emailId)}>
                <VisibilityIcon /> {/* MUI 상세 아이콘 */}
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default MailListTable; // 컴포넌트 익스포트