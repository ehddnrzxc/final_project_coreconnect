import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyDocuments } from '../api/approvalApi'; 
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { format } from 'date-fns'; 
import ApprovalStatusChip from '../components/ApprovalStatusChip'; 

function MyDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await getMyDocuments(); 
        setDocuments(res.data || []); 
      } catch (err) {
        console.error("내 상신함 조회 실패:", err);
        setError(err.response?.data?.message || "문서 목록을 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []); 

  const handleRowClick = (documentId) => {
    navigate(`/e-approval/doc/${documentId}`);
  };

  // 완료일 포맷팅 함수
  const formatCompletedDate = (doc) => {
    // 'COMPLETED' 상태이고, completedAt 값이 있을 때만 날짜 포맷
    if (doc.documentStatus === 'COMPLETED' && doc.completedAt) {
      return format(new Date(doc.completedAt), 'yyyy-MM-dd HH:mm');
    }
    // 그 외 (진행중, 반려 등)는 '-' 표시
    return '-';
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: "center", mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity='error'>{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
        내 상신함
      </Typography>
      
      {!loading && documents.length === 0 ? (
        <Alert severity='info'>상신한 문서가 없습니다.</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table sx={{ minWidth: 650 }} aria-label="my documents table">
            <TableHead sx={{ backgroundColor: "#f9f9f9" }}>
              {/* 테이블 헤더 순서 및 이름 변경 */}
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: '150px' }}>기안일</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '150px' }}>완료일</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '180px' }}>양식명</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>제목</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '130px' }}>기안부서</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '120px' }}>결재상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((doc) => (
                <TableRow
                  key={doc.documentId}
                  hover
                  onClick={() => handleRowClick(doc.documentId)}
                  sx={{ cursor: 'pointer' }}
                >
                  {/* 테이블 바디 순서 변경 */}
                  
                  {/* 기안일 */}
                  <TableCell>{format(new Date(doc.createdAt), 'yyyy-MM-dd HH:mm')}</TableCell>
                  
                  {/* 완료일 (로직 적용) */}
                  <TableCell>{formatCompletedDate(doc)}</TableCell>

                  {/* 양식명 */}
                  <TableCell>{doc.templateName}</TableCell>

                  {/* 제목 */}
                  <TableCell>{doc.documentTitle}</TableCell>
                  
                  {/* 기안부서 (API 응답에 drafterDeptName이 포함되어야 함) */}
                  <TableCell>{doc.deptName || '-'}</TableCell>

                  {/* 결재상태 */}
                  <TableCell align="center">
                    <ApprovalStatusChip status={doc.documentStatus} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default MyDocumentsPage;