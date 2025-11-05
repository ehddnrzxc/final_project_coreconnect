import React, { useState, useEffect } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
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
} from "@mui/material";

import {
  getPendingDocuments,
  getCompletedDocuments,
  getMyTasks,
} from "../api/approvalApi";

import ApprovalStatusChip from "../components/ApprovalStatusChip";

function ApprovalHomePage() {
  const [myTasks, setMyTasks] = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [completedDocs, setCompletedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleRowClick = (documentId) => {
    navigate(`/e-approval/doc/${documentId}`);
  };

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
        <Grid container spacing={2}>
          {myTasks.map((doc) => (
            <Grid item xs={12} sm={6} md={4} key={doc.documentId}>
              <Card
                component={RouterLink}
                to={`/e-approval/doc/${doc.documentId}`}
                elevation={2}
                sx={{ textDecoration: "none", height: "100%",
                  borderRadius: 2, transition: "all 0.2s",
                  "&:hover": {
                    boxShadow: 6,
                    transform: "translateY(-2px)",
                  },
                }}
                variant="outlined"
              >
                <CardContent>
                  <Typography variant="body2" color="primary">
                    {doc.templateName}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", my: 0.5 }}
                  >
                    {doc.documentTitle}
                  </Typography>
                  <ApprovalStatusChip status={doc.documentStatus} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
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
              {completedDocs.map((doc) => (
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