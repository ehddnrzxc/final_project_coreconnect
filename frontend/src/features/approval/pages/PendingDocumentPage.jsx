import React, { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Pagination, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getMyTasks } from "../api/approvalApi";

function PendingDocuments() {

  const [documents, setDocuments] = useState([]);  // 문서 목록
  const [loading, setLoading] = useState(true);  // 로딩 상태
  const [error, setError] = useState(null);  // 에러 상태
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getMyTasks();

        setDocuments(response.data);
      } catch (error) {
        console.error("결재 대기 문서 조회 실패:", error);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    loadDocuments();
  }, []);

  const handlePageChange = (e, value) => {
    setPage(value - 1);
  };

  const handleRowClick = documentId => {
    navigate(`/e-approval/doc/${documentId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: "fles", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        결재/합의 대기 문서
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="결재 대기 문서 테이블">
          <TableHead sx={{ bgcolor: "grey.100" }}>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>문서 번호</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>문서 양식</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>제목</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>기안자</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>기안일</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <Typography color="textSecondary">결재/합의 대기 중인 문서가 없습니다.</Typography>
                 </TableCell>
               </TableRow>
            ) : (
              documents
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map(doc => (
                <TableRow
                  key={doc.documentId}
                  hover
                  onClick={() => handleRowClick(doc.documentId)}
                  sx={{ cursor: "pointer", "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell align="center">{doc.documentId}</TableCell>
                  <TableCell>{doc.templateName}</TableCell>
                  <TableCell>{doc.documentTitle}</TableCell>
                  <TableCell align="center">{doc.writerName}</TableCell>
                  <TableCell align="center">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {documents.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3, mb: 2 }}>
          <Pagination
            count={Math.ceil(documents.length / rowsPerPage)}
            page={page + 1}
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

export default PendingDocuments;