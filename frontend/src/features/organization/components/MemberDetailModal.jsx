import { Dialog, DialogTitle, DialogContent, IconButton, Typography, Avatar, Divider, Box, Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { useNavigate } from "react-router-dom";
import { getJobGradeLabel } from "../../../utils/labelUtils";


const MemberDetailModal = ({ open, member, onClose }) => {

  const navigate = useNavigate();

  if (!member) return null; // 선택된 구성원이 없으면 모달 표시하지 않음

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 1,
        },
      }}
    >

      {/* 메일쓰기 버튼 */}
      <Box sx={{ position: "absolute", left: 16, top: 16, zIndex: 20 }}>
        <Button
          startIcon={<MailOutlineIcon />}
          variant="outlined"
          size="small"
          onClick={() => {
            navigate("/email/write", { state: { mailTo: member.email } });
            onClose();
          }}
        >
          메일쓰기
        </Button>
      </Box>

      {/* 모달 상단 (닫기 버튼 포함) */}
      <DialogTitle
        sx={{
          textAlign: "center",
          fontWeight: 700,
          position: "relative",
          pb: 1,
        }}
      >
        <IconButton
          onClick={onClose} // 닫기 버튼
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* 모달 본문 */}
      <DialogContent sx={{ textAlign: "center" }}>
        {/* 프로필 이미지 */}
        <Avatar
          src={member.profileUrl}
          sx={{
            width: 84,
            height: 84,
            mx: "auto",
            mb: 2,
            bgcolor: "#e0e0e0",
          }}
        />

        {/* 이름 + 직급 */}
        <Typography variant="h6" fontWeight={700}>
          {member.name} {member.jobGrade ? ` ${getJobGradeLabel(member.jobGrade)}` : ""}
        </Typography>

        {/* 부서 경로 */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {member.deptPath}
        </Typography>

        <Divider sx={{ my: 2 }} />

        {/* 상세 정보 목록 */}
        <Box sx={{ textAlign: "left", px: 2 }}>
          <InfoRow label="회사" value="코어커넥트" />
          <InfoRow label="부서" value={member.deptName} />
          <InfoRow label="직급" value={member.jobGrade ? getJobGradeLabel(member.jobGrade) : "-"} />
          <InfoRow label="이메일" value={member.email} />
          <InfoRow label="휴대전화" value={member.phone || "-"} />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

/** 한 줄 상세정보 */
const InfoRow = ({ label, value }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body1">{value}</Typography>
  </Box>
);

export default MemberDetailModal;
