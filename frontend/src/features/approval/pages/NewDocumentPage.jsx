import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTemplateDetail, submitDocument, saveDraft } from '../api/approvalApi';
import { Button, Alert, Box, CircularProgress, Paper, TextField, Typography, List, ListItem, ListItemText, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import PeopleIcon from '@mui/icons-material/People';
import ApprovalLineModal from './ApprovalLineModal';
import ApprovalTypeChip from '../components/ApprovalTypeChip';
import VacationForm from './VacationForm';
import DynamicApprovalTable from '../components/DynamicApprovalTable';
import BusinessTripForm from './BusinessTripForm';
import ExpenseForm from './ExpenseForm';

// --- 헬퍼 함수들 ---
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 휴가 기간 계산 로직
export const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end - start;
  if (diffTime < 0) return 0;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (error) {
    console.error("로컬 스토리지 사용자 정보 파싱 실패:", error);
  }
  return null;
};

// 템플릿 키에 따라 적절한 폼 컴포넌트를 반환하는 헬퍼 컴포넌트
const DynamicFormRenderer = ({ templateKey, formData, onFormChange }) => {
  switch (templateKey) {
    case 'VACATION':
      return <VacationForm formData={formData} onFormChange={onFormChange} />;
    case 'BUSINESSTRIP':
      return <BusinessTripForm formData={formData} onFormChange={onFormChange} />;
    case 'EXPENSE':
      return <ExpenseForm formData={formData} onFormChange={onFormChange} />;
    default:
      // DB에 temp_key가 있지만 React 폼이 없는 경우
      if(templateKey) {
        return <Alert severity="warning">해당 양식에 대한 React 폼이 구현되지 않았습니다. (Template Key: {templateKey})</Alert>;
      }
      // temp_key 자체가 없는 경우 (데이터 로딩 중 등)
      return <Alert severity="info">양식을 불러오는 중입니다...</Alert>;
  }
};

// 템플릿 키에 따라 formData의 초기값을 설정하는 함수
const getInitialFormData = templateKey => {
  const commonData = { createDate: getTodayDate() };

  switch (templateKey) {
    case 'VACATION':
      return {
        ...commonData,
        vacationType: "",
        startDate: "",
        endDate: "",
        duration: 0,
        reason: "",
      };
    case 'BUSINESSTRIP':
      return {
        ...commonData,
        startDate: "",
        endDate: "",
        destination: "",
        transportation: "",
        purpose: "",
        note: "",
        travelerEmpNo: "",
        travelerName: "",
        travelerPosition: "",
        travelerDept: "",
      };
    case 'EXPENSE':
      return {
        ...commonData,
        purpose: "",
        items: [],
        totalAmount: 0,
      }
    
    default:
      // 템플릿 키가 'VACATION' 등이 아닐 경우 공통 데이터만 반환
      return commonData;
  }
};


function NewDocumentPage() {
  const navigate = useNavigate();
  const { templateId } = useParams();

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [files, setFiles] = useState([]);
  const [approvalLine, setApprovalLine] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUser = useMemo(() => getCurrentUser(), []);

  // formData의 초기값을 공통 값으로만 설정
  const [formData, setFormData] = useState({
    createDate: getTodayDate(),
  });

  // 하위 폼 컴포넌트(VacationForm 등)에서 호출할 핸들러
  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // 휴가 기간 계산 로직은 'VACATION' 폼에만 해당되므로
      // 'VACATION' 폼 내부에서 처리하거나, 여기서 templateKey를 확인해야 함
      if (selectedTemplate?.temp_key === 'VACATION' && (name === 'startDate' || name === 'endDate')) {
        newData.duration = calculateDuration(newData.startDate, newData.endDate);
      }

      // 지출 총 금액 계산 로직
      if (selectedTemplate?.temp_key === 'EXPENSE' && name === 'items') {
        const newTotal = value.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        newData.totalAmount = newTotal;
      }
      return newData;
    });
  }, [selectedTemplate]);


  useEffect(() => {
    if (!templateId) {
      setError("유효하지 않은 양식 ID입니다.");
      setLoading(false);
      return;
    }

    const fetchTemplateDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const detailRes = await getTemplateDetail(templateId); 
        
        setSelectedTemplate(detailRes.data);
        setDocumentTitle(detailRes.data.templateName || "");

        if(!detailRes.data.temp_key) {
           setError("API 응답에 'temp_key'가 포함되어 있지 않습니다. 백엔드를 확인해주세요.");
           setLoading(false);
           return;
        }
        setFormData(getInitialFormData(detailRes.data.temp_key));

      } catch (error) {
        console.error("Error fetching template detail:", error);
        setError("선택된 양식 내용을 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchTemplateDetail();
    }
  }, [templateId, currentUser]);

  const handleFileChange = e => {
    setFiles(Array.from(e.target.files));
  };

  const handleModalSubmit = selectedLineFromModal => {
    setApprovalLine(selectedLineFromModal);
  };

  const handleSubmit = async isDraft => {
    if (!selectedTemplate) return;

    if (!documentTitle.trim()) {
      alert("문서 제목을 입력해주세요.");
      return;
    }

    if (!isDraft && approvalLine.length === 0) {
      alert("결재선을 1명 이상 지정해야 합니다. (상신 시 필수)");
      setModalOpen(true);
      return;
    }

    const documentDataJson = JSON.stringify(formData);

    const formattedApprovalLines = approvalLine.map(line => ({
      userId: line.userId,
      type: line.type,
    }));

    const requestDTO = {
      templateId: parseInt(templateId),
      documentTitle: documentTitle,
      documentDataJson: documentDataJson,
      approvalLines: formattedApprovalLines
    };
    
    const formDataToSend = new FormData();
    formDataToSend.append("dto", new Blob([JSON.stringify(requestDTO)], { type: "application/json" }));

    files.forEach(file => {
      formDataToSend.append("files", file);
    });

    try {
      setLoading(true);
      let res;
      if (isDraft) {
        res = await saveDraft(formDataToSend);
        alert(`문서가 임시저장되었습니다.`);
      } else {
        res = await submitDocument(formDataToSend);
        alert(`문서가 성공적으로 상신되었습니다.`);
      }

      if (res && res.data) {
        // 상신 성공 시, '문서 상세 페이지'로 이동합니다.
        navigate(`/e-approval/doc/${res.data}`);
      } else {
        navigate("/e-approval");
      }

    } catch (error) {
      console.error("문서 처리 실패:", error);
      const errorMsg = error.response?.data?.message || `문서 ${isDraft ? '임시저장' : '상신'}에 실패했습니다.`;
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity='error'>{error}</Alert>;
  if (!selectedTemplate) return <Alert severity='warning'>선택된 양식 정보를 찾을 수 없습니다.</Alert>;

  return (
    <Box>
      <Typography variant='h5' gutterBottom sx={{ fontWeight: "bold" }}>
        새 결재 문서 작성
      </Typography>
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          label="문서 제목"
          value={documentTitle}
          onChange={e => setDocumentTitle(e.target.value)}
          required
        />
      </Paper>

      <Paper elevation={3} sx={{ p: 4 }}>
        {/* --- 문서 양식 영역 레이아웃 --- */}
        {/* 공통 스타일 div */}
        <div style={{ width: '750px', margin: '0 auto', padding: '30px', border: '1px solid #ddd', fontFamily: "'Malgun Gothic', sans-serif" }}>
          
          {/* 1. 제목 (공통) */}
          <h1 style={{ fontSize: '32px', margin: '0', textAlign: 'center', paddingBottom: '10px', marginBottom: '20px', borderBottom: '2px solid #333' }}>
            {selectedTemplate.templateName}
          </h1>

          {/* 2. 기안자 정보 (좌) / 결재란 (우) Flex 컨테이너 (공통) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            
            {/* 2-1. 기안자 정보 테이블 (좌측) - (공통) */}
            <div style={{ width: '55%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <TableBody>
                  <tr>
                    <td style={{ border: '1px solid #ccc', backgroundColor: '#f8f8f8', padding: '10px', width: '100px', textAlign: 'center', fontWeight: 'bold' }}>기안자</td>
                    <td style={{ border: '1px solid #ccc', padding: '10px' }}>{currentUser?.name}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #ccc', backgroundColor: '#f8f8f8', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>소속</td>
                    <td style={{ border: '1px solid #ccc', padding: '10px' }}>{currentUser?.departmentName}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #ccc', backgroundColor: '#f8f8f8', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>기안일</td>
                    <td style={{ border: '1px solid #ccc', padding: '10px' }}>{formData.createDate}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #ccc', backgroundColor: '#f8f8f8', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>문서번호</td>
                    <td style={{ border: '1px solid #ccc', padding: '10px', color: '#999' }}>(자동채번)</td>
                  </tr>
                </TableBody>
              </table>
            </div>
            
            {/* 2-2. 결재란 (우측) - (공통) */}
            <div style={{ width: 'auto' }}>
              <DynamicApprovalTable approvers={approvalLine} drafter={currentUser} />
            </div>
          </div>

          {/* 3. 신청 내용 (하단) 
            하드코딩된 폼 대신 DynamicFormRenderer 컴포넌트를 사용
          */}
          <DynamicFormRenderer
            templateKey={selectedTemplate.temp_key}
            formData={formData}
            onFormChange={handleFormChange}
          />

        </div>
        {/* --- 문서 양식 영역 끝 --- */}

        {/* 하단 결재선/파일첨부/버튼 영역 (공통) */}
        <Box sx={{ mt: 3, p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant='h6' sx={{ fontWeight: 'bold' }}>결재선</Typography>
            <Button variant='outlined' startIcon={<PeopleIcon />} onClick={() => setModalOpen(true)}>결재선 지정</Button>
          </Box>
          {approvalLine.length === 0 ? (
            <Typography variant='body2' color='text.secondary'>'결재선 지정' 버튼을 눌러 결재자를 선택하세요.</Typography>
          ) : (
            <List dense>
              {approvalLine.map((line, index) => (
                <ListItem key={line.userId} disablePadding>
                  <ApprovalTypeChip type={line.type} size="small" sx={{ mr: 1.5, minWidth: '50px' }} />
                  <ListItemText primary={`${index + 1}. ${line.name} (${line.positionName})`} secondary={line.deptName} />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Box sx={{ mt: 3, borderTop: '1px solid #eee', pt: 2 }}>
          <Typography variant='body1' sx={{ mb: 1, fontWeight: 'bold' }}>파일 첨부</Typography>
          <input type='file' multiple onChange={handleFileChange} />
          {files.length > 0 && <Typography variant='caption' sx={{ display: 'block', mt: 1 }}>{files.length}개 파일 첨부됨</Typography>}
        </Box>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" startIcon={<SaveIcon />} onClick={() => handleSubmit(true)} disabled={loading}>임시 저장</Button>
          <Button variant="contained" color="primary" startIcon={<SendIcon />} onClick={() => handleSubmit(false)} disabled={loading || !documentTitle.trim() || approvalLine.length === 0}>결재 상신</Button>
        </Box>
      </Paper>

      <ApprovalLineModal open={modalOpen} handleClose={() => setModalOpen(false)} currentLine={approvalLine} handleSubmitLine={handleModalSubmit} />
    </Box>
  );
}

export default NewDocumentPage;