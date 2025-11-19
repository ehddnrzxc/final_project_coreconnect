import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react"
import { useSnackbarContext } from "../../../components/utils/SnackbarContext";

const ApprovalProcessModal = ({ open, handleClose, handleSubmit, type }) => {
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (open) {
      setComment("");
    }
  }, [open]);

  const { showSnack } = useSnackbarContext();
  const isApprove = type === 'APPROVE';
  const title = isApprove ? "결재 승인" : "결재 반려";
  const buttonColor = isApprove ? "primary" : "error";
  const buttonText = isApprove ? "승인" : "반려";

  const placeholder = isApprove ? "결재 의견을 입력하세요 (선택사항)" : "반려 사유를 입력하세요 (필수)";
  const onSubmit = () => {
    if (!isApprove && !comment.trim()) {
      showSnack("반려 사유는 필수입니다.");
      return;
    }
    handleSubmit(comment);
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 'bold' }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          {isApprove
            ? "문서를 승인하시겠습니까? 아래에 의견을 남길 수 있습니다."
            : "문서를 반려 처리합니다. 반려 사유를 입력해주세요."}
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          id="comment"
          label={isApprove ? "승인 의견" : "반려 사유"}
          type="text"
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          placeholder={placeholder}
          value={comment}
          onChange={e => setComment(e.target.value)}
          color={isApprove ? "primary" : "error"}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2}}>
        <Button onClick={handleClose} color="inherit">
          취소
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          color={buttonColor}
        >
          {buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  );

};


export default ApprovalProcessModal;