import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDocumentDetail } from '../api/approvalApi';
import { Alert, Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import DynamicApprovalTable from '../components/DynamicApprovalTable';
import DrafterInfoTable from '../components/DrafterInfoTable';

function DocumentDetailPage() {
  const { documentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documentData, setDocumentData] = useState(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getDocumentDetail(documentId);
        console.log("API 응답 (documentData):", res.data);
        setDocumentData(res.data);
      } catch (error) {
        console.error("문서 상세 정보 조회 실패:", error);
        setError(error.response?.data?.message || "문서 정보를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchDocument();
  }, [documentId]);

  const mergedHtml = useMemo(() => {
    if (!documentData || !documentData.tempHtmlContent) {
      return "";
    }

    try {
      let htmlContent = documentData.tempHtmlContent;
      const jsonData = JSON.parse(documentData.documentContent || '{}');

      const mergeData = { ...jsonData };


      for (const key in mergeData) {
        const value = mergeData[key] || '';
        const placeholder = new RegExp(`\\\${${key}}`, 'g');
        htmlContent = htmlContent.replace(placeholder, value);
      }

      htmlContent = htmlContent.replace(/\$\{.*?\}/g, '');

      return htmlContent;

    } catch (error) {
      console.error("HTML 병합 실패:", error);
      return "<p>양식을 렌더링하는 데 실패했습니다.</p>";
    }
  }, [documentData]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: "center", mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity='error'>{error}</Alert>;
  if (!documentData) return <Alert severity='warning'>문서 데이터를 찾을 수 없습니다.</Alert>;

  return (
    <Box>
      <Typography variant='h5' gutterBottom sx={{ fontWeight: "bold" }}>
        {documentData.documentTitle} (상태: {documentData.docStatus})
      </Typography>

      <Paper elevation={3} sx={{ p: 4}}>
        <div style={{ width: '750px', margin: '0 auto', padding: '30px', border: '1px solid #ddd', fontFamily: "'Malgun Gothic', sans-serif", position: 'relative' }}>
          <h1 style={{ fontSize: '32px', margin: '0', textAlign: 'center', paddingBottom: '10px', marginBottom: '20px' }}>
            {documentData.templateName}
          </h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <DrafterInfoTable
              drafter={documentData.drafter}
              createDate={documentData.createdAt}
              documentId={documentData.documentId}
            />
            <div style={{ width: 'auto' }}>
              <DynamicApprovalTable
                approvers={documentData.approvalLines}
                drafter={documentData.drafter}
              />
            </div>
          </div>
          <div
            dangerouslySetInnerHTML={{ __html: mergedHtml }}
          />
        </div>

        <Box sx={{ mt: 3, borderTop: '1px solid #eee', pt: 2 }}>
          <Typography variant='body1' sx={{ mb: 1, fontWeight: 'bold' }}>첨부 파일</Typography>
          {documentData.files && documentData.files.length > 0 ? (
            <ul>
              {documentData.files.map(file => (
                <li key={file.fileId}>
                  <a href={file.fileUrl} target='_blank' rel='moopener noreferrer'>
                    {file.fileName}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <Typography variant='caption'>첨부된 파일이 없습니다.</Typography>
          )}
        </Box>
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          {/* (예시: 내가 결재할 차례일 때)
          <Button variant='outlined' color='error'>반려</Button>
          <Button variant='contained' color='primary'>승인</Button>
          */}
        </Box>
      </Paper>
    </Box>
  )

}

export default DocumentDetailPage;