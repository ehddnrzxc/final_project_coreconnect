import React, { useState, useEffect, useRef } from 'react';

// --- Axios 인스턴스 ---
import http from '../../../api/http.js';

// --- MUI 컴포넌트 ---
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Paper,
  Button,
  TextField,
  Grid,
  Divider
} from '@mui/material';

// --- HTML 소독 라이브러리 ---
import DOMPurify from 'dompurify';

// --- (가정) 별도로 구현된 결재선 및 파일 업로드 컴포넌트 ---
// 이 파일들의 코드가 필요합니다.
// import ApprovalLineSelector from './ApprovalLineSelector';
// import FileUpload from './FileUpload';

// (임시) 위 컴포넌트가 없어서 임시로 만든  placeholder 컴포넌트
// 실제로는 위 import를 사용하고 아래 코드는 삭제해야 합니다.
const ApprovalLineSelector = ({ onChange }) => (
  <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#fafafa', textAlign: 'center' }}>
    <Typography variant="body2" color="text.secondary">
      (결재선 지정 컴포넌트 영역)
    </Typography>
    <Button size="small" sx={{mt: 1}} onClick={() => onChange([ {userId: 10, type: "APPROVE"}, {userId: 12, type: "AGREE"} ])}>
      (임시) 결재선 설정
    </Button>
  </Paper>
);
const FileUpload = ({ onChange }) => (
  <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#fafafa', textAlign: 'center' }}>
    <Typography variant="body2" color="text.secondary">
      (파일 첨부 컴포넌트 영역)
    </Typography>
     <Button size="small" sx={{mt: 1}} onClick={() => onChange([/* (임시) File 객체 배열 */])}>
      (임시) 파일 선택
    </Button>
  </Paper>
);
// (여기까지 임시 컴포넌트)


/**
 * 새 결재 작성 페이지
 */
function ApprovalWrite() {

  // --- 1. State 정의 ---
  const [templates, setTemplates] = useState([]); 
  const [selectedTemplate, setSelectedTemplate] = useState(null); // [수정] 단순 ID가 아닌 객체 전체 저장
  const [cleanHtml, setCleanHtml] = useState('');
  
  // React가 제어하는 핵심 데이터
  const [documentTitle, setDocumentTitle] = useState('');
  const [approvalLines, setApprovalLines] = useState([]); 
  const [files, setFiles] = useState([]); 

  // [추가] 양식별 데이터 상태 (React가 직접 제어)
  const [vacationData, setVacationData] = useState({
    vacationType: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [expenseData, setExpenseData] = useState({
    item: '',
    amount: '',
    details: ''
  });


  // 로딩 및 에러 상태
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // [삭제] HTML DOM 접근용 Ref는 더 이상 필요하지 않습니다.
  // const contentRef = useRef(null); 

  // --- 2. Effect: 양식 목록(Dropdown) 불러오기 ---
  useEffect(() => {
    setLoadingList(true);
    http.get('/approvals/templates')
      .then(response => {
        // [수정] 백엔드에서 templateKey를 보내준다고 가정 (예: "VACATION", "EXPENSE")
        setTemplates(response.data); 
        setError(null);
      })
      .catch(err => {
        console.error("양식 목록 로딩 실패:", err);
        setError("양식 목록을 불러오는 데 실패했습니다.");
      })
      .finally(() => setLoadingList(false));
  }, []);

  // --- 3. Effect: 특정 양식 상세(HTML) 불러오기 ---
  useEffect(() => {
    if (!selectedTemplate) { // [수정]
      setCleanHtml('');
      return;
    }

    setLoadingDetail(true);
    http.get(`/approvals/templates/${selectedTemplate.templateId}`) // [수정]
      .then(response => {
        // [수정] 백엔드 HTML은 <input> 등이 제거된 순수 레이아웃만 있다고 가정
        const sanitizedHtml = DOMPurify.sanitize(response.data.templateContent);
        setCleanHtml(sanitizedHtml);
        setError(null);
      })
      .catch(err => {
        console.error("양식 상세 로딩 실패:", err);
        setError("양식 상세 정보를 불러오는 데 실패했습니다.");
        setCleanHtml('');
      })
      .finally(() => setLoadingDetail(false));
      
  }, [selectedTemplate]); // [수정]

  // --- 4. Handler: 양식 선택 시 ---
  const handleTemplateChange = (event) => {
    const selectedId = event.target.value;
    const template = templates.find(t => t.templateId === selectedId) || null;
    setSelectedTemplate(template); // [수정] ID 대신 객체 저장

    // [추가] 양식 변경 시 관련 데이터 리셋
    setVacationData({ vacationType: '', startDate: '', endDate: '', reason: '' });
    setExpenseData({ item: '', amount: '', details: '' });
    setDocumentTitle('');
  };

  // [추가] React 상태(State)와 입력을 연결하는 핸들러
  const handleVacationChange = (e) => {
    const { name, value } = e.target;
    setVacationData(prev => ({ ...prev, [name]: value }));
  };

  const handleExpenseChange = (e) => {
    const { name, value } = e.target;
    setExpenseData(prev => ({ ...prev, [name]: value }));
  };


  // --- 5. Handler: 상신하기 버튼 클릭 시 ---
  const handleSubmit = async (isDraft = false) => { 
    setError(null);

    // --- (A) [수정] React 상태(State)에서 값 읽어오기 ---
    let documentContentData = {};
    const templateKey = selectedTemplate?.templateKey; // "VACATION", "EXPENSE" 등

    try {
      if (templateKey === "VACATION") { // [수정] "휴가 신청서" (매직스트링) 대신 templateKey 사용
        documentContentData = vacationData;

        if (!isDraft && (!vacationData.startDate || !vacationData.endDate || !vacationData.reason)) {
          setError("양식의 필수 항목(기간, 사유)을 입력하세요.");
          return;
        }
      }
      else if (templateKey === "EXPENSE") { // [수정]
        documentContentData = expenseData;
         
        if (!isDraft && (!expenseData.item || !expenseData.amount)) {
          setError("양식의 필수 항목(항목, 금액)을 입력하세요.");
          return;
        }
      }
      // [삭제] querySelector 관련 로직 모두 삭제
    } catch (e) {
      console.error("데이터 처리 실패:", e);
      setError("양식 데이터를 처리하는 중 오류가 발생했습니다.");
      return;
    }
    
    // --- (B) DTO 및 FormData 생성 (이 부분은 기존 로직과 동일) ---
    setSubmitting(true);
    
    const dto = {
      templateId: selectedTemplate.templateId, // [수정]
      documentTitle: documentTitle,
      documentContent: JSON.stringify(documentContentData), 
      approvalLines: approvalLines, 
    };

    const formData = new FormData();
    formData.append(
      'dto', 
      new Blob([JSON.stringify(dto)], { type: 'application/json' })
    );

    files.forEach((file) => {
      formData.append('files', file);
    });
    
    // --- (C) API 전송 (이 부분은 기존 로직과 동일) ---
    const url = isDraft ? '/approvals/drafts' : '/approvals'; 
    
    try {
      const response = await http.post(url, formData);
      const actionText = isDraft ? "임시저장" : "상신";
      alert(`문서(ID: ${response.data})가 성공적으로 ${actionText}되었습니다.`);
      // navigate(`/approvals/${response.data}`);
    } catch (err) {
      console.error("상신/임시저장 실패:", err);
      const errorMsg = err.response?.data?.message || err.response?.data || err.message;
      setError(errorMsg || "문서 처리 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // [추가] 양식별 React 입력 필드를 렌더링하는 함수
  const renderTemplateInputs = () => {
    const templateKey = selectedTemplate?.templateKey;

    if (templateKey === "VACATION") {
      return (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>휴가 종류</InputLabel>
              <Select name="vacationType" value={vacationData.vacationType} label="휴가 종류" onChange={handleVacationChange}>
                <MenuItem value="ANNUAL">연차</MenuItem>
                <MenuItem value="SICK">병가</MenuItem>
                <MenuItem value="OTHER">기타</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField name="startDate" label="시작일" type="date" fullWidth InputLabelProps={{ shrink: true }} value={vacationData.startDate} onChange={handleVacationChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField name="endDate" label="종료일" type="date" fullWidth InputLabelProps={{ shrink: true }} value={vacationData.endDate} onChange={handleVacationChange} />
          </Grid>
          <Grid item xs={12}>
            <TextField name="reason" label="휴가 사유" multiline rows={4} fullWidth value={vacationData.reason} onChange={handleVacationChange} />
          </Grid>
        </Grid>
      );
    } 
    
    if (templateKey === "EXPENSE") {
      return (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <TextField name="item" label="지출 항목" fullWidth value={expenseData.item} onChange={handleExpenseChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField name="amount" label="금액" type="number" fullWidth value={expenseData.amount} onChange={handleExpenseChange} />

          </Grid>
          <Grid item xs={12}>
            <TextField name="details" label="상세 내역" multiline rows={4} fullWidth value={expenseData.details} onChange={handleExpenseChange} />
          </Grid>
        </Grid>
      );
    }

    return null; // 해당 양식에 맞는 입력 필드가 없음
  };


  // --- 6. Render ---
  return (
    <Box sx={{ p: 3, maxWidth: 1000, margin: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        새 결재 작성
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={1} sx={{ p: 3 }}>
        <Grid container spacing={2}>
          {/* 1. 양식 선택 드롭다운 */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="template-select-label">결재 양식</InputLabel>
              <Select
                labelId="template-select-label"
                value={selectedTemplate?.templateId || ''} // [수정]
                label="결재 양식"
                onChange={handleTemplateChange}
                disabled={loadingList || submitting}
              >
                <MenuItem value=""><em>-- 양식을 선택하세요 --</em></MenuItem>
                {templates.map((template) => (
                  <MenuItem key={template.templateId} value={template.templateId}>
                    {template.templateName}
                  </MenuItem>
                ))}
              </Select>
              {loadingList && <CircularProgress size={20} sx={{ position: 'absolute', right: 40, top: 18 }} />}
            </FormControl>
          </Grid>

          {/* 2. 문서 제목 입력 */}
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth 
              label="문서 제목" 
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              disabled={!selectedTemplate || submitting} // [수정]
            />
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />

        {/* 3. 결재선 지정 컴포넌트 */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>결재선 지정</Typography>
          <ApprovalLineSelector onChange={setApprovalLines} />
        </Box>
        
        {/* 4. 파일 첨부 컴포넌트 */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>파일 첨부</Typography>
          <FileUpload onChange={setFiles} />
        </Box>
        
        <Divider sx={{ my: 3 }} />

        {/* 5. 양식 내용 렌더링 영역 */}
        <Typography variant="h6" gutterBottom>
          양식 내용
        </Typography>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            minHeight: '400px', 
            border: '1px solid #ddd', 
            backgroundColor: '#f9f9f9' 
          }}
        >
          {loadingDetail && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
              <CircularProgress />
            </Box>
          )}
          {!loadingDetail && !cleanHtml && (
            <Typography color="text.secondary" sx={{ textAlign: 'center', pt: '100px' }}>
              양식을 선택하면 여기에 내용이 표시됩니다.
            </Typography>
          )}
          
          {cleanHtml && (
            <Box>
              {/* [수정] 1. 순수 HTML (테이블 레이아웃 등) 렌더링 */}
              <Box
                // [삭제] ref={contentRef}
                dangerouslySetInnerHTML={{ __html: cleanHtml }}
              />
              
              {/* [추가] 2. React가 제어하는 입력 필드 렌더링 */}
              {renderTemplateInputs()}
            </Box>
          )}
        </Paper>
      </Paper>

      {/* 6. 상신/임시저장 버튼 */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button 
          variant="outlined" 
          color="secondary"
          onClick={() => handleSubmit(true)} // 임시저장 (true)
          disabled={!selectedTemplate || submitting} // [수정]
        >
          {submitting ? <CircularProgress size={24} /> : "임시저장"}
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => handleSubmit(false)} // 상신 (false)
          disabled={!selectedTemplate || loadingDetail || submitting} // [수정]
        >
          {submitting ? <CircularProgress size={24} /> : "상신하기"}
        </Button>
      </Box>
    </Box>
  );
}

export default ApprovalWrite;