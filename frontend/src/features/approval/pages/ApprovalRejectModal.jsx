import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

/**
 * 결재 반려 사유 입력 모달
 * * @param {boolean} open - 모달 열림 여부
 * @param {function} handleClose - 모달 닫기 함수
 * @param {function} handleSubmit - 반려 확인 (제출) 함수
 */
function ApprovalRejectModal({ open, handleClose, handleSubmit }) {
  const [reason, setReason] = useState('');

  // 모달이 닫힐 때 내부 상태 초기화
  useEffect(() => {
    if (!open) {
      setReason('');
    }
  }, [open]);

  // '반려 확인' 버튼 클릭 시
  const handleConfirmClick = () => {
    if (!reason.trim()) {
      alert("반려 사유를 반드시 입력해야 합니다.");
      return;
    }
    // 입력된 사유(reason)를 부모 컴포넌트로 전달
    handleSubmit(reason);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="reject-modal-title"
    >
      <Box sx={modalStyle}>
        <Typography id="reject-modal-title" variant="h6" component="h2">
          반려 사유 입력 (필수)
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          placeholder="반려 사유를 자세히 입력해주세요."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          sx={{ mt: 2, mb: 2 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button variant="outlined" onClick={handleClose}>취소</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleConfirmClick}
          >
            반려 확인
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default ApprovalRejectModal;