import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { approveDocument, downloadFile, getDocumentDetail, rejectDocument } from '../api/approvalApi';
import { Alert, Box, Button, Chip, CircularProgress, Paper, Typography } from '@mui/material';
import DynamicApprovalTable from '../components/DynamicApprovalTable';
import DrafterInfoTable from '../components/DrafterInfoTable';
import ApprovalProcessModal from '../components/ApprovalProcessModal';
import EditIcon from '@mui/icons-material/Edit';
import DocumentStatusChip from '../components/DocumentStatusChip';
import { useSnackbarContext } from '../../../components/utils/SnackbarContext';
import { UserProfileContext } from '../../../App';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function DocumentDetailPage() {
  const { documentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documentData, setDocumentData] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    open: false,
    type: null
  });

  const { showSnack } = useSnackbarContext();
  const navigate = useNavigate();
  const { userProfile } = useContext(UserProfileContext);
  const printRef = useRef(null);

  const handleDownload = (fileId, fileName) => {
    downloadFile(fileId, fileName);
  };

  const handlePdfDownload = async () => {
    const element = printRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;

      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${documentData.documentTitle || '결재문서'}.pdf`);

    } catch (error) {
      console.error("PDF 생성 실패:", error);
      showSnack("PDF 생성 중 오류 발생", "error");
    }
  };

  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDocumentDetail(documentId);
      setDocumentData(res.data);
    } catch (error) {
      console.error("문서 상세 정보 조회 실패:", error);
      setError(error.response?.data?.message || "문서 정보를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const handleOpenApprove = () => setModalConfig({ open: true, type: 'APPROVE' });

  const handleOpenReject = () => setModalConfig({ open: true, type: 'REJECT' });

  const handleCloseModal = () => setModalConfig({ ...modalConfig, open: false });

  const handleProcessComplete = async comment => {
    try {
      const requestDTO = { approvalComment: comment };

      if (modalConfig.type === 'APPROVE') {
        await approveDocument(documentId, requestDTO);
        showSnack("결재가 승인되었습니다.", "success");
      } else {
        await rejectDocument(documentId, requestDTO);
        showSnack("결재가 반려되었습니다.", "warning");
      }

      handleCloseModal();

      await fetchDocument();

    } catch (error) {
      console.error("결재 처리 실패:", error);
      const actionName = modalConfig.type === 'APPROVE' ? "승인" : "반려";
      showSnack(error.response?.data?.message || `${actionName} 처리에 실패했습니다.`, "error");
    }
  };

  const handleEdit = () => {
    navigate(`/e-approval/edit/${documentId}`);
  };

  const mergedHtml = useMemo(() => {
    if (!documentData || !documentData.processedHtmlContent) {
      return "";
    }

    return documentData.processedHtmlContent;
  }, [documentData]);

  const isDrafter = useMemo(() => {
    
    if (!userProfile || !userProfile.email) return false;

    if (!documentData || !documentData.drafter || !documentData.drafter.userEmail) {
      return false;
    }

    const userEmail = userProfile.email.trim().toLowerCase();
    const drafterEmail = documentData.drafter.userEmail.trim().toLowerCase();

    return userEmail === drafterEmail;
  }, [userProfile, documentData]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: "center", mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity='error'>{error}</Alert>;
  if (!documentData) return <Alert severity='warning'>문서 데이터를 찾을 수 없습니다.</Alert>;

  return (
    <Box>
      <Typography variant='h5' gutterBottom sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1.5 }}>
        {documentData.documentTitle}
        <DocumentStatusChip status={documentData.documentStatus} />
      </Typography>

      <Paper elevation={3} sx={{ p: 4}}>
        <div ref={printRef} style={{ width: '750px', margin: '0 auto', padding: '30px', backgroundColor: 'white', border: '1px solid #ddd', fontFamily: "'Malgun Gothic', sans-serif", position: 'relative' }}>
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
            style={{
              wordBreak: "break-all",
              overflowWrap: "break-word",
              whiteSpace: "pre-wrap"
            }}
            dangerouslySetInnerHTML={{ __html: mergedHtml }}
          />
        </div>

        <Box sx={{ mt: 3, borderTop: '1px solid #eee', pt: 2 }}>
          <Typography variant='body1' sx={{ mb: 1, fontWeight: 'bold' }}>첨부 파일</Typography>
          {documentData.files && documentData.files.length > 0 ? (
            <ul>
              {documentData.files.map(file => (
                <li key={file.fileId} >
                  <Chip
                  icon={<AttachFileIcon />}
                  label={`${file.fileName}`}
                  onClick={() => handleDownload(file.fileId, file.fileName)}
                  clickable
                  key={file.fileId}
                  sx={{
                    mr: 1,
                    px: 1.8,
                    py: 1.1,
                    fontWeight: 500,
                    bgcolor: "#f4f6fa",
                    borderRadius: "6px",
                    fontSize: "15px"
                  }}
                />
                </li>
              ))}
            </ul>
          ) : (
            <Typography variant='caption'>첨부된 파일이 없습니다.</Typography>
          )}
        </Box>
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant='outlined'
            color='primary'
            startIcon={<PictureAsPdfIcon />}
            onClick={handlePdfDownload}
          >
            PDF 다운로드
          </Button>
          {documentData.myTurnApprove && (
            <>
              <Button variant='outlined' sx={{ color: '#66bb6a', borderColor: '#66bb6a'}} onClick={handleOpenApprove}>
                승인
              </Button>
              <Button variant='outlined' color='error' onClick={handleOpenReject}>반려</Button>
            </>
          )}
          {documentData.documentStatus === 'DRAFT' && isDrafter && (
            <Button variant='contained' startIcon={<EditIcon />} onClick={handleEdit}>
              수정하기
            </Button>
          )}
        </Box>
      </Paper>
      <ApprovalProcessModal
        open={modalConfig.open}
        type={modalConfig.type}
        handleClose={handleCloseModal}
        handleSubmit={handleProcessComplete}
      />
    </Box>
  )

}

export default DocumentDetailPage;