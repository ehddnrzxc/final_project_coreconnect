import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { approveDocument, downloadFile, getDocumentDetail, rejectDocument } from '../api/approvalApi';
import { Alert, Box, Button, Chip, CircularProgress, Paper, Typography } from '@mui/material';
import DynamicApprovalTable from '../components/DynamicApprovalTable';
import DrafterInfoTable from '../components/DrafterInfoTable';
import ApprovalRejectModal from '../components/ApprovalRejectModal';
import EditIcon from '@mui/icons-material/Edit';
import DocumentStatusChip from '../components/DocumentStatusChip';
import { useSnackbarContext } from '../../../components/utils/SnackbarContext';
import { UserProfileContext } from '../../../App';
import AttachFileIcon from '@mui/icons-material/AttachFile';

function DocumentDetailPage() {
  const { documentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documentData, setDocumentData] = useState(null);
  const [openRejectModal, setOpenRejectModal] = useState(false);

  const { showSnack } = useSnackbarContext();

  const navigate = useNavigate();

  const currentUser = useContext(UserProfileContext);

  const handleDownload = (fileId, fileName) => {
    downloadFile(fileId, fileName);
  };

  useEffect(() => {
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
    fetchDocument();
  }, [documentId]);

  const handleApprove = async () => {
    const comment = prompt("결재 의견을 입력하세요. 하기 싫음 말고");
    if (comment === null) {
      return;
    }

    try {
      const requestDTO = { approvalComment: comment || ""};
      await approveDocument(documentId, requestDTO);
      showSnack("결재가 승인되었습니다.", "success");
      navigate("/e-approval");
    } catch (error) {
      console.error("승인 처리 실패:", error);
      showSnack(error.response?.data?.message || "승인 처리에 실패했습니다.", "error");
    }
  };

  const handleOpenRejectModal = () => setOpenRejectModal(true);

  const handleCloseRejectModal = () => setOpenRejectModal(false);

  const handleRejectConfirm = async reason => {
    try {
      const requestDTO = { approvalComment: reason };
      await rejectDocument(documentId, requestDTO);

      showSnack("결재가 반려되었습니다.", "warning");
      handleCloseRejectModal();
      navigate("/e-approval");
    } catch (error) {
      console.error("반려 처리 실패:", error);
      showSnack(error.response?.data?.message || "반려 처리에 실패했습니다.", "error");
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
    
    if (!currentUser || !currentUser.email) {
      return false;
    }

    if (!documentData || !documentData.drafter || !documentData.drafter.userEmail) {
      return false;
    }

    const userEmail = currentUser.email.trim().toLowerCase();
    const drafterEmail = documentData.drafter.userEmail.trim().toLowerCase();

    return userEmail === drafterEmail;
  }, [currentUser, documentData]);

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
          {documentData.myTurnApprove && (
            <>
              <Button variant='outlined' color='primary' onClick={handleApprove}>승인</Button>
              <Button variant='outlined' color='error' onClick={handleOpenRejectModal}>반려</Button>
            </>
          )}
          {documentData.documentStatus === 'DRAFT' && isDrafter && (
            <Button variant='contained' startIcon={<EditIcon />} onClick={handleEdit}>
              수정하기
            </Button>
          )}
        </Box>
      </Paper>
      <ApprovalRejectModal
        open={openRejectModal}
        handleClose={handleCloseRejectModal}
        handleSubmit={handleRejectConfirm}
      />
    </Box>
  )

}

export default DocumentDetailPage;