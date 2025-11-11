import React, { useState, useEffect } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  CircularProgress,
  Alert,
  Stack,
  Button,
  IconButton,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore"
import NavigateNextIcon from "@mui/icons-material/NavigateNext"

import {
  getPendingDocuments,
  getCompletedDocuments,
  getMyTasks,
} from "../api/approvalApi";

import ApprovalStatusChip from "../components/ApprovalStatusChip";

const ITEMS_PER_PAGE = 4;

function ApprovalHomePage() {
  const [myTasks, setMyTasks] = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [completedDocs, setCompletedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        setLoading(true);
        setError(null);

        const [tasksRes, pendingRes, completedRes] = await Promise.all([
          getMyTasks(),
          getPendingDocuments(),
          getCompletedDocuments(),
        ]);

        setMyTasks(tasksRes.data);
        setPendingDocs(pendingRes.data);
        setCompletedDocs(completedRes.data);
      } catch (err) {
        console.error("Error fetching approval documents:", err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, []);

  const handleRowClick = documentId => {
    navigate(`/e-approval/doc/${documentId}`);
  };

  const pageCount = Math.ceil(myTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = myTasks.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
        결재 홈
      </Typography>

      {/* --- 1. 내가 결재할 문서 (Cards) --- */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        결재 대기 문서
      </Typography>
      {myTasks.length === 0 ? (
        <Typography>결재 대기중인 문서가 없습니다.</Typography>
      ) : (
        <>
          <Grid container spacing={2}>
            {paginatedTasks.map((doc) => (
              <Grid item xs={12} sm={6} md={3} key={doc.documentId}>
                <Card
                  sx={{
                    textDecoration: "none",
                    height: "100%",
                    borderRadius: 2,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      boxShadow: 8,
                      transform: "translateY(-4px)",
                    },
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                  variant="outlined"
                >
                  <CardContent sx={{ pb: 1 }}>
                    <ApprovalStatusChip status={doc.documentStatus} />

                    <Typography
                      variant="h6"
                      sx={{ fontWeight: "bold", my: 0.5 }}
                    >
                      {doc.documentTitle}
                    </Typography>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        기안자: {doc.writerName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        기안일: {new Date(doc.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        결재양식: {doc.templateName}
                      </Typography>
                    </Stack>
                  </CardContent>

                  <Box sx={{ p: 2, pt: 1 }}>
                    <Button
                      component={RouterLink}
                      to={`/e-approval/doc/${doc.documentId}`}
                      variant="outlined"
                      fullWidth
                      sx={{
                        color: "text.primary",
                        borderColor: "grey.300",
                        backgroundColor: "grey.50",
                        "&:hover": {
                          backgroundColor: "grey.100",
                          borderColor: "grey.400",
                        },
                      }}
                    >
                      결재하기
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          {pageCount > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <IconButton
                onClick={() => setPage((prev) => prev - 1)}
                disabled={page === 0}
              >
                <NavigateBeforeIcon />
              </IconButton>
              <IconButton
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page === pageCount - 1}
              >
                <NavigateNextIcon />
              </IconButton>
            </Box>
          )}
        </>
      )}

      {/* --- 2. 진행중인 문서 (Table) --- */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        진행중인 문서 (내가 상신한 문서)
      </Typography>
      {pendingDocs.length === 0 ? (
        <Typography>진행중인 문서가 없습니다.</Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table sx={{ minWidth: 650 }} aria-label="진행중인 문서 테이블">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                <TableCell>문서 제목</TableCell>
                <TableCell>결재 양식</TableCell>
                <TableCell>기안일</TableCell>
                <TableCell>상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingDocs.map((doc) => (
                <TableRow
                  key={doc.documentId}
                  hover
                  onClick={() => handleRowClick(doc.documentId)}
                  sx={{
                    cursor: "pointer",
                    "&:last-child td, &:last-child th": { border: 0 },
                  }}
                >
                  <TableCell component="th" scope="row">
                    {doc.documentTitle}
                  </TableCell>
                  <TableCell>{doc.templateName}</TableCell>
                  <TableCell>
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <ApprovalStatusChip status={doc.documentStatus} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* --- 3. 완료된 문서 (Table) --- */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        완료된 문서
      </Typography>
      {completedDocs.length === 0 ? (
        <Typography>완료된 문서가 없습니다.</Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table sx={{ minWidth: 650 }} aria-label="완료된 문서 테이블">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                <TableCell>문서 제목</TableCell>
                <TableCell>결재 양식</TableCell>
                <TableCell>완료일</TableCell>
                <TableCell>상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {completedDocs.map(doc => (
                <TableRow
                  key={doc.documentId}
                  hover
                  onClick={() => handleRowClick(doc.documentId)}
                  sx={{
                    cursor: "pointer",
                    "&:last-child td, &:last-child th": { border: 0 },
                  }}
                >
                  <TableCell component="th" scope="row">
                    {doc.documentTitle}
                  </TableCell>
                  <TableCell>{doc.templateName}</TableCell>
                  <TableCell>
                    {new Date(doc.completedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
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

export default ApprovalHomePage;
