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
  Chip,
} from "@mui/material";
import { format } from "date-fns";
import DocumentStatusChip from "../components/DocumentStatusChip";
import ApprovalLineStatusChip from "../components/ApprovalLineStatusChip";

const STATUS_OPTIONS = ["전체", "진행중", "반려", "승인"];
const STATUS_MAP = {
  진행중: ["IN_PROGRESS", "DRAFT"],
  반려: ["REJECTED"],
  승인: ["COMPLETED"],
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

  const formatCompletedDate = (doc) => {
    if (
      (doc.documentStatus === "COMPLETED" ||
        doc.documentStatus === "REJECTED") &&
      doc.completedAt
    ) {
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
    return "-";
  };

  const filteredDocuments = useMemo(() => {
    if (statusFilter === "전체") return documents;
    const targets = STATUS_MAP[statusFilter] || [];
    return documents.filter((doc) => targets.includes(doc.documentStatus));
  }, [documents, statusFilter]);

  // --- [UI 헬퍼 함수] 역할(Role) 텍스트 반환 ---
  const getRoleLabel = type => {
    if (type === "AGREE") return "(합의)";
    return ""; 
  };

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
                <TableCell sx={{ fontWeight: "bold" }}>결재선</TableCell>
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
              {filteredDocuments.map((doc) => {
                 // 1. 결재/합의자 (REFER가 아닌 것들)
                 const approvers = (doc.approvalLines || [])
                   .filter(line => line.type !== "REFER") // DTO 필드명이 type인지 approvalType인지 확인 필요 (DTO기준 type)
                   .sort((a, b) => a.approvalOrder - b.approvalOrder);

                 // 2. 참조자 (REFER인 것들)
                 const referrers = (doc.approvalLines || [])
                   .filter(line => line.type === "REFER");

                 return (
                  <TableRow
                    key={doc.documentId}
                    hover
                    onClick={() => handleRowClick(doc.documentId)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(doc.createdAt), "yyyy-MM-dd")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(doc.createdAt), "HH:mm")}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatCompletedDate(doc)}</TableCell>
                    <TableCell>{doc.templateName}</TableCell>
                    <TableCell>{doc.documentTitle}</TableCell>
                    
                    {/* --- 결재선 표시 영역 수정 --- */}
                    <TableCell>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        
                        {/* 1. 결재/합의 라인 (화살표 표시) */}
                        {approvers.length > 0 ? (
                          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.5 }}>
                            {approvers.map((line, index) => (
                              <React.Fragment key={line.lineId}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                  <Typography variant="body2">
                                    {line.name}
                                    {/* 합의자인 경우 (합의) 표시 */}
                                    <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '2px' }}>
                                      {getRoleLabel(line.type)}
                                    </span>
                                  </Typography>
                                  <ApprovalLineStatusChip status={line.approvalStatus} />
                                </Box>
                                {index < approvers.length - 1 && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mx: 0.5 }}>
                                    →
                                  </Typography>
                                )}
                              </React.Fragment>
                            ))}
                          </Box>
                        ) : (
                          "-"
                        )}

                        {/* 2. 참조 라인 (하단 회색 박스) */}
                        {referrers.length > 0 && (
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1, 
                              mt: 0.5, 
                              p: 0.8, 
                              backgroundColor: '#f5f5f5', 
                              borderRadius: 1,
                              width: 'fit-content'
                            }}
                          >
                            <Chip 
                              label="참조" 
                              size="small" 
                              variant="outlined" 
                              sx={{ height: 20, fontSize: '0.7rem', borderColor: '#bbb', color: '#666' }} 
                            />
                            <Typography variant="caption" color="text.secondary">
                              {referrers.map(r => r.name).join(", ")}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell>{doc.deptName || "-"}</TableCell>
                    <TableCell align="center">
                      <DocumentStatusChip status={doc.documentStatus} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default MyDocumentsPage;