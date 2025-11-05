import { Link as RouterLink } from "react-router-dom";
import { useState, useEffect } from "react";
import http from "../../../api/http.js";

// (MUI 교체) MUI 컴포넌트 대량 import
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Link,
  CircularProgress, // 로딩
  Alert,
  IconButton, // 에러
} from "@mui/material";

// --- 헬퍼 함수 (동일) ---

// 날짜 포맷팅
const formatDate = (dateTimeString) => {
  if (!dateTimeString) return "";
  return dateTimeString.split("T")[0];
};

// Enum 한글 변환
const mapStatusToKorean = (statusEnum) => {
  switch (statusEnum) {
    case "IN_PROGRESS": return "진행중";
    case "DRAFT": return "임시저장";
    case "COMPLETED": return "완료";
    case "REJECTED": return "반려";
    default: return statusEnum;
  }
};

// (MUI 교체) Chip 컴포넌트의 'color' prop에 맞게 Enum 상태를 매핑하는 함수
const mapStatusToChipColor = (statusEnum) => {
  switch (statusEnum) {
    case "IN_PROGRESS": return "primary"; // (파랑)
    case "DRAFT": return "default"; // (회색)
    case "COMPLETED": return "success"; // (초록)
    case "REJECTED": return "error"; // (빨강)
    default: return "default";
  }
};


/**
 * ApprovalTable 컴포넌트
 */
const ApprovalTable = ({ title, docs }) => (
  <Box component="section" sx={{ mb: 4 }}> 
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h6" component="h3">
        {title}
      </Typography>
      <Link component={RouterLink} to="#" underline="hover">
        더보기 +
      </Link>
    </Box>

    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} size="small" aria-label="approval table">
        <TableHead sx={{ backgroundColor: '#f9f9f9' }}>
          <TableRow>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>기안일</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>결재양식</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>제목</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>결재상태</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {docs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ p: 4, color: 'text.secondary' }}>
                결재 문서가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            docs.map((doc) => (
              <TableRow
                key={doc.documentId}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell align="center">{formatDate(doc.createdAt)}</TableCell>
                <TableCell>{doc.templateName}</TableCell>
                <TableCell>
                  <Link
                    component={RouterLink}
                    to={`/e-approval/doc/${doc.documentId}`}
                    underline="hover"
                    sx={{ fontWeight: 500 }}
                  >
                    {doc.documentTitle}
                  </Link>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={mapStatusToKorean(doc.documentStatus)}
                    color={mapStatusToChipColor(doc.documentStatus)}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
);

/**
 * "전자결재 홈" 대시보드 페이지 (MUI 적용)
 */
const ApprovalHomePage = () => {
  const [pendingDocs, setPendingDocs] = useState([]);
  const [completedDocs, setCompletedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [pendingResponse, completedResponse] = await Promise.all([
          http.get("/approvals/my-documents/pending"),
          http.get("/approvals/my-documents/completed"),
        ]);

        setPendingDocs(pendingResponse.data);
        setCompletedDocs(completedResponse.data);

      } catch (err) {
        setError("데이터를 불러오는 데 실패했습니다.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // 로딩 UI
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // 에러 UI
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  // 메인 렌더링
  return (
    <Box sx={{ py: 3 }}> 
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          전자결재 홈
        </Typography>
        <IconButton className="btn btn--ghost">
          <i className="fa-solid fa-ellipsis"></i>
        </IconButton>
      </Box>

      <ApprovalTable title="기안 진행 문서" docs={pendingDocs} />

      <ApprovalTable title="완료 문서" docs={completedDocs} />
    </Box>
  );
};

export default ApprovalHomePage;