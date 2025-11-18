import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyReferenceDocuments } from '../api/approvalApi';
import { Alert, Box, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

const ReferDocumentPage = () => {
  
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getMyReferenceDocuments();  // API 호출

        setDocuments(response.data);
      } catch (error) {
        console.error("참조 문서 조회 실패:", error);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    loadDocuments();
  }, []);

  const handleRowClick = documentId => {
    navigate(`/e-approval/doc/${documentId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5}}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity='error'>{error}</Alert>;
  }

  if (documents.length === 0) {
    return (
      <Box>
        <Typography variant='h4' gutterBottom>
          참조 대기 문서
        </Typography>
        <Alert severity='info' sx={{ mt: 2 }}>
          참조 문서가 없습니다.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant='h4' gutterBottom>
        참조 대기 문서
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label='참조 문서 테이블'>
          <TableHead sx={{ bgcolor: "grey.100" }}>
            <TableRow>
              <TableCell align='center' sx={{ fontWeight: "bold" }}>
                문서 번호
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>문서 양식</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>제목</TableCell>
              <TableCell align='center' sx={{ fontWeight: "bold" }}>
                기안자
              </TableCell>
              <TableCell align='center' sx={{ fontWeight: "bold" }}>
                ?
              </TableCell>
            </TableRow>
          </TableHead>  
          <TableBody>
            {documents.map(doc => (
              <TableRow
                key={doc.documentId}
                hover
                onClick={() => handleRowClick(doc.documentId)}
                sx={{ cursor: "pointer", "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell align='center'>{doc.documentId}</TableCell>
                <TableCell>{doc.templateName}</TableCell>
                <TableCell>{doc.documentTitle}</TableCell>
                <TableCell align='center'>{doc.writerName}</TableCell>
                <TableCell align='center'>
                  {new Date(doc.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )

};

export default ReferDocumentPage;