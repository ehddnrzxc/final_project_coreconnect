import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyDraftBox } from '../api/approvalApi'; 
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
  Pagination,
} from '@mui/material';
import { format } from 'date-fns'; 
import DocumentStatusChip from '../components/DocumentStatusChip';

function MyDraftsPage() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // API 호출 (getMyDraftBox)
        const res = await getMyDraftBox(); 
        
        setDrafts(res.data || []); 
      } catch (err) {
        console.error("임시저장함 조회 실패:", err);
        setError(err.response?.data?.message || "임시저장 문서를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchDrafts();
  }, []);

  const handlePageChange = (e, value) => {
    setPage(value - 1);
  };

  const handleRowClick = (draft) => {
    
    if (!draft.templateId) {
      alert("문서의 템플릿 ID가 없습니다. API 응답을 확인해주세요.");
      return;
    }

    navigate(`/e-approval/doc/${draft.documentId}`);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: "center", mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity='error'>{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
        임시저장함
      </Typography>
      
      <TableContainer component={Paper} variant="outlined">
        <Table sx={{ minWidth: 650 }} aria-label="my drafts table">
          <TableHead sx={{ backgroundColor: "#f9f9f9" }}>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 'bold', width: '120px' }}>문서 상태</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>제목</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '180px' }}>양식명</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '150px' }}>임시저장일</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {drafts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                   <Typography color="textSecondary">임시저장된 문서가 없습니다.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              drafts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((doc) => (
                <TableRow
                  key={doc.documentId}
                  hover
                  onClick={() => handleRowClick(doc)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell align="center">
                    <DocumentStatusChip status={doc.documentStatus} />
                  </TableCell>
                  <TableCell>{doc.documentTitle}</TableCell>
                  <TableCell>{doc.templateName}</TableCell>
                  <TableCell>{format(new Date(doc.createdAt), 'yyyy-MM-dd HH:mm')}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {drafts.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3, mb: 2 }}>
          <Pagination
            count={Math.ceil(drafts.length / rowsPerPage)}
            page={page + 1} // 0-based index를 1-based UI로 변환
            onChange={handlePageChange}
            shape="circular"
            showFirstButton={false}
            showLastButton={false}
            sx={{
              "& .Mui-selected": {
                backgroundColor: "#00bcd4 !important",
                color: "#fff",
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}

export default MyDraftsPage;