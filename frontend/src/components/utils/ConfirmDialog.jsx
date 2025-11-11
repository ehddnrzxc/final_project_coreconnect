import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

/**
 * 공용 확인창 컴포넌트
 * props:
 * - open: 다이얼로그 열림 여부
 * - title: 제목 텍스트
 * - message: 본문 메시지
 * - onConfirm: 확인 클릭 시 실행
 * - onCancel: 취소 클릭 시 실행
 */
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel }) => {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title || "확인"}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message || "이 작업을 진행하시겠습니까?"}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>취소</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          확인
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
