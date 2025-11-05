import { useState, useEffect } from "react";
import { useParams, Link as RouterLink } from "react-router-dom"; // [수정] RouterLink로 별칭 부여
import http from "../../../api/http.js"; 

// --- MUI 컴포넌트 ---
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Link, // [추가]
  List, // [추가]
  ListItem, // [추가]
  ListItemText, // [추가]
  ListItemIcon, // [추가]
  Container // [추가]
} from "@mui/material";

// --- MUI 아이콘 ---
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // [추가]
import AttachFileIcon from '@mui/icons-material/AttachFile'; // [추가]


// 날짜/시간 포맷팅 헬퍼 ("2025-11-03T10:30:00" -> "2025-11-03 10:30")
const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return "";
  return dateTimeString.replace("T", " ");
};

// 결재선 상태(Enum) 한글 변환
const mapApprovalStatusToKorean = (status) => {
  switch (status) {
    case "WAITING":
      return "대기";
    case "APPROVED":
      return "승인";
    case "REJECTED":
      return "반려";
    default:
      return status;
  }
};

// [추가] 결재선 상태(Enum)에 따른 MUI 스타일 반환
const getStatusStyles = (status) => {
  switch (status) {
    case "APPROVED":
      return { 
        borderColor: 'success.main', 
        backgroundColor: 'success.lightest', // (테마에 lightest가 없다면 #e8f5e9)
        color: 'success.dark' 
      };
    case "REJECTED":
      return { 
        borderColor: 'error.main', 
        backgroundColor: 'error.lightest', // (테마에 없다면 #fdecea)
        color: 'error.dark' 
      };
    case "WAITING":
    default:
      return { 
        borderColor: 'grey.400', 
        backgroundColor: 'grey.100',
        color: 'text.secondary'
      };
  }
}

const ApprovalDetailPage = () => {
  // 1. URL 경로에서 :documentId 값을 가져옵니다.
  const { documentId } = useParams(); 
  
  const [doc, setDoc] = useState(null); // DocumentDetailResponseDTO
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. documentId를 기반으로 API 호출
  useEffect(() => {
    const fetchDocumentDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await http.get(`/approvals/${documentId}`);
        setDoc(response.data); 
      } catch (err) {
        setError("문서를 불러오는 데 실패했습니다.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocumentDetail();
  }, [documentId]); 

  // 3. 로딩 및 에러 UI [MUI로 수정]
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>상세 문서를 불러오는 중입니다...</Typography>
      </Container>
    );
  }
  if (error) {
    return (
      <Container maxWidth="md" sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  if (!doc) {
    return (
      <Container maxWidth="md" sx={{ p: 3 }}>
        <Alert severity="info">문서 정보가 없습니다.</Alert>
      </Container>
    );
  }

  // 4. 상세 DTO(doc)를 사용한 상세 페이지 렌더링 [MUI로 수정]
  return (
    <Box sx={{ p: 3, maxWidth: 1000, margin: 'auto' }}>
      
      {/* --- 헤더 --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button 
          component={RouterLink} // react-router-dom의 Link와 연결
          to="/e-approval" 
          startIcon={<ArrowBackIcon />}
        >
          목록으로
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="success">승인(바뀔예정이에요)</Button>
          <Button variant="outlined" color="error">반려(바뀔예정)</Button>
        </Box>
      </Box>

      <Paper elevation={1} sx={{ p: 3 }}>
        
        {/* --- 결재선 --- */}
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 2, 
            overflowX: 'auto', 
            p: 2, 
            mb: 2, 
            backgroundColor: 'grey.50',
            borderRadius: 1 
          }}
        >
          {doc.approvalLines && doc.approvalLines.length > 0 ? (
            doc.approvalLines.map((line) => (
              <Paper
                key={line.approvalLineId} 
                variant="outlined"
                sx={{ 
                  p: 1.5, 
                  minWidth: 110, 
                  textAlign: 'center', 
                  ...getStatusStyles(line.status) // [수정] 상태별 스타일 적용
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  {mapApprovalStatusToKorean(line.status)}
                </Typography>
                <Typography variant="subtitle2" sx={{ my: 0.5 }}>
                  {line.approver.userName}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {line.approver.deptName}
                </Typography>
                
                {line.approvedAt && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    {formatDateTime(line.approvedAt)}
                  </Typography>
                )}
              </Paper>
            ))
          ) : (
            <Typography color="text.secondary" sx={{ p: 2, width: '100%', textAlign: 'center' }}>
              결재선 정보가 없습니다.
            </Typography>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* --- 문서 기본 정보 (Grid 사용) --- */}
        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={2}>
            <Typography variant="body2" color="text.secondary">문서제목</Typography>
          </Grid>
          <Grid item xs={12} sm={10}>
            <Typography variant="body1" fontWeight="medium">{doc.documentTitle}</Typography>
          </Grid>

          <Grid item xs={12} sm={2}>
            <Typography variant="body2" color="text.secondary">기안자</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body1">{doc.writer.userName} ({doc.writer.deptName})</Typography>
          </Grid>

          <Grid item xs={12} sm={2}>
            <Typography variant="body2" color="text.secondary">기안일</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body1">{formatDateTime(doc.createdAt)}</Typography>
          </Grid>
          
          <Grid item xs={12} sm={2}>
            <Typography variant="body2" color="text.secondary">결재양식</Typography>
          </Grid>
          <Grid item xs={12} sm={10}>
            <Typography variant="body1">{doc.templateName}</Typography>
          </Grid>
        </Grid>
      </Paper>
      
      <Divider sx={{ my: 3 }} />

      {/* --- 문서 본문 (HTML 렌더링) --- */}
      <Typography variant="h6" gutterBottom>문서 내용</Typography>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          minHeight: '300px', 
          border: '1px solid #ddd', 
          backgroundColor: '#f9f9f9',
          mb: 3
        }}
      >
        <div 
          dangerouslySetInnerHTML={{ __html: doc.documentContent }} 
        />
      </Paper>

      {/* --- 첨부 파일 목록 --- */}
      {doc.files && doc.files.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>첨부파일</Typography>
          <Paper variant="outlined" sx={{ p: 1 }}>
            <List dense>
              {doc.files.map((file) => (
                <ListItem 
                  key={file.fileId || file.fileUrl}
                  component={Link} // [수정] ListItem 자체를 Link로
                  href={file.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <AttachFileIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={file.fileName} 
                    secondary={`${Math.round(file.fileSize / 1024)} KB`} 
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default ApprovalDetailPage;