import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getMyDocuments } from "../api/approvalApi";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { format } from "date-fns";
import ApprovalStatusChip from "../components/ApprovalStatusChip";

const STATUS_OPTIONS = ["전체", "진행중", "반려", "완료"];
const STATUS_MAP = {
  진행중: ["IN_PROGRESS", "DRAFT"],
  반려: ["REJECTED"],
  완료: ["COMPLETED"],
};

function MyDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("전체");
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
        setError(
          err.response?.data?.message || "문서 목록을 불러오는 데 실패했습니다."
        );
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
    if (doc.documentStatus === "COMPLETED" && doc.completedAt) {
      return (
        <>
          <Typography variant="body2">
            {format(new Date(doc.completedAt), "yyyy-MM-dd")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {format(new Date(doc.completedAt), "HH:mm")}
          </Typography>
        </>
      );
    }
    // 그 외 (진행중, 반려 등)는 '-' 표시
    return "-";
  };

  const filteredDocuments = useMemo(() => {
    if (statusFilter === "전체") return documents;
    const targets = STATUS_MAP[statusFilter] || [];
    return documents.filter((doc) => targets.includes(doc.documentStatus));
  }, [documents, statusFilter]);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
        내 상신함
      </Typography>

      <Box
        sx={{ display: "flex", justifyContent: "flex-end", mb: 1.5, gap: 1 }}
      >
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="status-filter-label">결재 상태</InputLabel>
          <Select
            labelId="status-filter-label"
            label="결재 상태"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {!loading && filteredDocuments.length === 0 ? (
        <Alert severity="info">상신한 문서가 없습니다.</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table sx={{ minWidth: 650 }} aria-label="my documents table">
            <TableHead sx={{ backgroundColor: "#f9f9f9" }}>
              {/* 테이블 헤더 순서 및 이름 변경 */}
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", width: "150px" }}>
                  기안일
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", width: "150px" }}>
                  완료일
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", width: "180px" }}>
                  양식명
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>제목</TableCell>
                <TableCell sx={{ fontWeight: "bold", width: "130px" }}>
                  기안부서
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", width: "120px" }}
                >
                  결재상태
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow
                  key={doc.documentId}
                  hover
                  onClick={() => handleRowClick(doc.documentId)}
                  sx={{ cursor: "pointer" }}
                >

                  {/* 기안일 */}
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(doc.createdAt), "yyyy-MM-dd")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(doc.createdAt), "HH:mm")}
                    </Typography>
                  </TableCell>

                  {/* 완료일 (로직 적용) */}
                  <TableCell>{formatCompletedDate(doc)}</TableCell>

                  {/* 양식명 */}
                  <TableCell>{doc.templateName}</TableCell>

                  {/* 제목 */}
                  <TableCell>{doc.documentTitle}</TableCell>

                  {/* 기안부서 (API 응답에 drafterDeptName이 포함되어야 함) */}
                  <TableCell>{doc.deptName || "-"}</TableCell>

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
